/**
 * Email Builder - Constructs RFC 8621 compliant JMAP Email objects
 *
 * Takes generated content, threading context, and scenario parameters
 * to build complete Email objects ready for JMAP Email/set or Email/import.
 */

import type { ResolvedPersona } from "./scenario-parser.js"
import type { ThreadingContext } from "./thread-builder.js"
import type { AttachmentMetadata } from "./attachment-generator.js"
import type { GeneratedContent } from "./ai-generator.js"
import { generateBlobId, generateContentId } from "./thread-builder.js"

/**
 * JMAP EmailAddress structure
 */
export interface JMAPEmailAddress {
  name: string | null
  email: string
}

/**
 * JMAP Email Body Part
 */
export interface JMAPBodyPart {
  partId?: string | null
  blobId?: string | null
  size?: number
  type: string
  charset?: string | null
  name?: string | null
  disposition?: string | null
  cid?: string | null
  subParts?: JMAPBodyPart[] | null
}

/**
 * JMAP Email Body Value
 */
export interface JMAPBodyValue {
  value: string
  isEncodingProblem: boolean
  isTruncated: boolean
}

/**
 * JMAP Email Header
 */
export interface JMAPEmailHeader {
  name: string
  value: string
}

/**
 * JMAP Email Attachment
 */
export interface JMAPAttachment {
  blobId: string
  type: string
  name: string | null
  size: number
  cid: string | null
  disposition: string | null
  isInline: boolean
}

/**
 * Complete JMAP Email object for Email/set creation
 */
export interface JMAPEmailCreate {
  mailboxIds: Record<string, boolean>
  from: JMAPEmailAddress[]
  to: JMAPEmailAddress[]
  cc?: JMAPEmailAddress[]
  bcc?: JMAPEmailAddress[]
  replyTo?: JMAPEmailAddress[]
  subject: string
  sentAt?: string
  keywords: Record<string, boolean>
  messageId?: string[]
  inReplyTo?: string[] | null
  references?: string[] | null
  bodyStructure: JMAPBodyPart
  bodyValues: Record<string, JMAPBodyValue>
  attachments?: JMAPAttachment[]
}

/**
 * Generated email with full metadata
 */
export interface GeneratedEmail {
  id: string
  threadId: string
  scenarioId: string
  emailIndex: number
  create: JMAPEmailCreate
  rawContent?: {
    text: string
    html: string
  }
}

/**
 * Convert ResolvedPersona to JMAP EmailAddress
 */
const toJMAPAddress = (persona: ResolvedPersona): JMAPEmailAddress => ({
  name: persona.name,
  email: persona.email,
})

/**
 * Convert keywords array to JMAP keywords object
 */
const toKeywordsObject = (keywords: string[]): Record<string, boolean> => {
  const result: Record<string, boolean> = {}
  for (const keyword of keywords) {
    result[keyword] = true
  }
  return result
}

/**
 * Calculate approximate size of a string in bytes
 */
const calculateSize = (content: string): number => {
  return Buffer.byteLength(content, "utf-8")
}

/**
 * Build body structure for plain text only
 * Note: For Email/set creation, we only include partId and type (not blobId/size)
 */
const buildPlainTextBodyStructure = (
  _scenarioId: string,
  _emailIndex: number,
  textContent: string
): { structure: JMAPBodyPart; values: Record<string, JMAPBodyValue> } => {
  const partId = "1"

  return {
    structure: {
      partId,
      type: "text/plain",
    },
    values: {
      [partId]: {
        value: textContent,
        isEncodingProblem: false,
        isTruncated: false,
      },
    },
  }
}

/**
 * Build body structure for HTML only
 * Note: For Email/set creation, we only include partId and type
 */
const buildHtmlBodyStructure = (
  _scenarioId: string,
  _emailIndex: number,
  htmlContent: string
): { structure: JMAPBodyPart; values: Record<string, JMAPBodyValue> } => {
  const partId = "1"

  return {
    structure: {
      partId,
      type: "text/html",
    },
    values: {
      [partId]: {
        value: htmlContent,
        isEncodingProblem: false,
        isTruncated: false,
      },
    },
  }
}

/**
 * Build body structure for multipart/alternative (text + HTML)
 * Note: For Email/set creation, we only include partId and type
 */
const buildMultipartAlternativeStructure = (
  _scenarioId: string,
  _emailIndex: number,
  textContent: string,
  htmlContent: string
): { structure: JMAPBodyPart; values: Record<string, JMAPBodyValue> } => {
  const textPartId = "1"
  const htmlPartId = "2"

  const textPart: JMAPBodyPart = {
    partId: textPartId,
    type: "text/plain",
  }

  const htmlPart: JMAPBodyPart = {
    partId: htmlPartId,
    type: "text/html",
  }

  return {
    structure: {
      type: "multipart/alternative",
      subParts: [textPart, htmlPart],
    },
    values: {
      [textPartId]: {
        value: textContent,
        isEncodingProblem: false,
        isTruncated: false,
      },
      [htmlPartId]: {
        value: htmlContent,
        isEncodingProblem: false,
        isTruncated: false,
      },
    },
  }
}

/**
 * Build body structure with attachments (multipart/mixed)
 * Note: For Email/set creation, attachments require pre-uploaded blobs.
 * We use multipart/alternative for the body and store attachment metadata separately.
 */
const buildMultipartMixedStructure = (
  _scenarioId: string,
  _emailIndex: number,
  textContent: string,
  htmlContent: string,
  attachments: AttachmentMetadata[]
): {
  structure: JMAPBodyPart
  values: Record<string, JMAPBodyValue>
  jmapAttachments: JMAPAttachment[]
} => {
  const textPartId = "1"
  const htmlPartId = "2"

  // Build text/html alternative part (no blobId/size for creation)
  const textPart: JMAPBodyPart = {
    partId: textPartId,
    type: "text/plain",
  }

  const htmlPart: JMAPBodyPart = {
    partId: htmlPartId,
    type: "text/html",
  }

  // For Email/set creation, we use multipart/alternative body
  // Attachments would need to be uploaded separately and referenced
  // For now, store attachment metadata but use simple body structure

  // Build JMAP attachments array (for reference, not used in creation)
  const jmapAttachments: JMAPAttachment[] = attachments.map((att) => ({
    blobId: att.blobId,
    type: att.type,
    name: att.name,
    size: att.size,
    cid: att.cid ?? null,
    disposition: att.disposition,
    isInline: att.isInline,
  }))

  return {
    structure: {
      type: "multipart/alternative",
      subParts: [textPart, htmlPart],
    },
    values: {
      [textPartId]: {
        value: textContent,
        isEncodingProblem: false,
        isTruncated: false,
      },
      [htmlPartId]: {
        value: htmlContent,
        isEncodingProblem: false,
        isTruncated: false,
      },
    },
    jmapAttachments,
  }
}

/**
 * Email builder parameters
 */
export interface EmailBuilderParams {
  scenarioId: string
  emailIndex: number
  content: GeneratedContent
  threading: ThreadingContext
  from: ResolvedPersona
  to: ResolvedPersona[]
  cc: ResolvedPersona[]
  bcc: ResolvedPersona[]
  mailboxId: string
  keywords: string[]
  bodyType: string
  attachments: AttachmentMetadata[]
  receivedAt?: Date
}

/**
 * Build a complete JMAP Email object
 */
export const buildEmail = (params: EmailBuilderParams): GeneratedEmail => {
  const {
    scenarioId,
    emailIndex,
    content,
    threading,
    from,
    to,
    cc,
    bcc,
    mailboxId,
    keywords,
    bodyType,
    attachments,
    receivedAt = new Date(),
  } = params

  // Build body structure based on type
  let structure: JMAPBodyPart
  let values: Record<string, JMAPBodyValue>
  let jmapAttachments: JMAPAttachment[] | undefined

  if (attachments.length > 0 || bodyType === "multipart/mixed") {
    const result = buildMultipartMixedStructure(
      scenarioId,
      emailIndex,
      content.textBody,
      content.htmlBody,
      attachments
    )
    structure = result.structure
    values = result.values
    jmapAttachments = result.jmapAttachments
  } else if (bodyType === "multipart/alternative") {
    const result = buildMultipartAlternativeStructure(
      scenarioId,
      emailIndex,
      content.textBody,
      content.htmlBody
    )
    structure = result.structure
    values = result.values
  } else if (bodyType === "text/html") {
    const result = buildHtmlBodyStructure(scenarioId, emailIndex, content.htmlBody)
    structure = result.structure
    values = result.values
  } else {
    // Default to plain text
    const result = buildPlainTextBodyStructure(
      scenarioId,
      emailIndex,
      content.textBody
    )
    structure = result.structure
    values = result.values
  }

  // Build the JMAP Email create object
  const create: JMAPEmailCreate = {
    mailboxIds: { [mailboxId]: true },
    from: [toJMAPAddress(from)],
    to: to.map(toJMAPAddress),
    subject: content.subject,
    sentAt: receivedAt.toISOString(),
    keywords: toKeywordsObject(keywords),
    messageId: [threading.messageId],
    inReplyTo: threading.inReplyTo ? [threading.inReplyTo] : null,
    references: threading.references.length > 0 ? threading.references : null,
    bodyStructure: structure,
    bodyValues: values,
  }

  // Add optional fields
  if (cc.length > 0) {
    create.cc = cc.map(toJMAPAddress)
  }

  if (bcc.length > 0) {
    create.bcc = bcc.map(toJMAPAddress)
  }

  if (jmapAttachments && jmapAttachments.length > 0) {
    create.attachments = jmapAttachments
  }

  return {
    id: threading.emailId,
    threadId: threading.threadId,
    scenarioId,
    emailIndex,
    create,
    rawContent: {
      text: content.textBody,
      html: content.htmlBody,
    },
  }
}

/**
 * Build inline image attachments for an email
 */
export const buildInlineImageAttachments = (
  scenarioId: string,
  emailIndex: number,
  count: number
): AttachmentMetadata[] => {
  const attachments: AttachmentMetadata[] = []

  for (let i = 0; i < count; i++) {
    const blobId = generateBlobId(scenarioId, emailIndex, "inline", i)
    const contentId = generateContentId(scenarioId, emailIndex, i)

    attachments.push({
      blobId,
      type: "image/png",
      name: `inline-image-${i + 1}.png`,
      size: 50 * 1024, // 50KB default
      cid: contentId,
      disposition: "inline",
      isInline: true,
    })
  }

  return attachments
}

/**
 * Build attachment metadata from scenario specification
 */
export const buildAttachmentMetadata = (
  scenarioId: string,
  emailIndex: number,
  attachments: Array<{ type: string; name: string; sizeBytes: number }>
): AttachmentMetadata[] => {
  return attachments.map((att, i) => ({
    blobId: generateBlobId(scenarioId, emailIndex, "attachment", i),
    type: att.type,
    name: att.name,
    size: att.sizeBytes,
    disposition: "attachment" as const,
    isInline: false,
  }))
}
