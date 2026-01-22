/**
 * Thread Builder - Handles Message-ID, In-Reply-To, and References linkage
 *
 * Generates deterministic message IDs and builds proper threading relationships
 * according to RFC 5322 and RFC 8621.
 */

import * as crypto from "crypto"

/**
 * Domain for generated message IDs
 */
const MESSAGE_ID_DOMAIN = "test.local"

/**
 * Generate a deterministic message ID based on scenario and email index
 *
 * @param scenarioId - The scenario identifier
 * @param emailIndex - Index of the email within the scenario
 * @param seed - Optional seed for additional uniqueness
 * @returns A valid RFC 5322 Message-ID (without angle brackets)
 */
export const generateMessageId = (
  scenarioId: string,
  emailIndex: number,
  seed?: string
): string => {
  const data = `${scenarioId}:${emailIndex}:${seed ?? "default"}`
  const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 24)
  return `${hash}.${emailIndex}@${MESSAGE_ID_DOMAIN}`
}

/**
 * Generate a deterministic thread ID based on scenario
 *
 * @param scenarioId - The scenario identifier
 * @returns A thread ID for grouping emails
 */
export const generateThreadId = (scenarioId: string): string => {
  const hash = crypto.createHash("sha256").update(scenarioId).digest("hex").slice(0, 16)
  return `T${hash}`
}

/**
 * Generate a deterministic email ID for JMAP
 *
 * @param scenarioId - The scenario identifier
 * @param emailIndex - Index of the email within the scenario
 * @returns A JMAP email ID
 */
export const generateEmailId = (
  scenarioId: string,
  emailIndex: number
): string => {
  const data = `${scenarioId}:email:${emailIndex}`
  const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 24)
  return `E${hash}`
}

/**
 * Generate a deterministic blob ID
 *
 * @param scenarioId - The scenario identifier
 * @param emailIndex - Index of the email within the scenario
 * @param partType - Type of blob (body, attachment, etc.)
 * @param partIndex - Index of the part
 * @returns A JMAP blob ID
 */
export const generateBlobId = (
  scenarioId: string,
  emailIndex: number,
  partType: string,
  partIndex: number
): string => {
  const data = `${scenarioId}:blob:${emailIndex}:${partType}:${partIndex}`
  const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 32)
  return `B${hash}`
}

/**
 * Threading context for building email headers
 */
export interface ThreadingContext {
  messageId: string
  inReplyTo: string | null
  references: string[]
  threadId: string
  emailId: string
}

/**
 * Build threading context for a thread scenario
 *
 * @param scenarioId - The scenario identifier
 * @param emailCount - Number of emails in the thread
 * @param replyToIndices - Array mapping each email index to the index it replies to (or undefined)
 * @returns Array of threading contexts for each email
 */
export const buildThreadContext = (
  scenarioId: string,
  emailCount: number,
  replyToIndices: (number | undefined)[]
): ThreadingContext[] => {
  const threadId = generateThreadId(scenarioId)
  const contexts: ThreadingContext[] = []

  // First, generate all message IDs
  const messageIds = Array.from({ length: emailCount }, (_, i) =>
    generateMessageId(scenarioId, i)
  )

  // Build contexts with proper threading
  for (let i = 0; i < emailCount; i++) {
    const replyToIndex = replyToIndices[i]
    const messageId = messageIds[i]!
    const emailId = generateEmailId(scenarioId, i)

    if (replyToIndex === undefined || replyToIndex < 0) {
      // First email in thread or standalone
      contexts.push({
        messageId,
        inReplyTo: null,
        references: [],
        threadId,
        emailId,
      })
    } else {
      // Reply to another email
      const replyToMessageId = messageIds[replyToIndex]
      const parentContext = contexts[replyToIndex]

      // Build references: parent's references + parent's message ID
      const references = parentContext
        ? [...parentContext.references, parentContext.messageId]
        : replyToMessageId
          ? [replyToMessageId]
          : []

      contexts.push({
        messageId,
        inReplyTo: replyToMessageId ?? null,
        references,
        threadId,
        emailId,
      })
    }
  }

  return contexts
}

/**
 * Build threading context for a single email (standalone)
 *
 * @param scenarioId - The scenario identifier
 * @returns Threading context for the single email
 */
export const buildSingleEmailContext = (scenarioId: string): ThreadingContext => {
  return {
    messageId: generateMessageId(scenarioId, 0),
    inReplyTo: null,
    references: [],
    threadId: generateThreadId(scenarioId),
    emailId: generateEmailId(scenarioId, 0),
  }
}

/**
 * Generate a Content-ID for inline attachments
 *
 * @param scenarioId - The scenario identifier
 * @param emailIndex - Index of the email
 * @param attachmentIndex - Index of the attachment
 * @returns A Content-ID string (without angle brackets)
 */
export const generateContentId = (
  scenarioId: string,
  emailIndex: number,
  attachmentIndex: number
): string => {
  const data = `${scenarioId}:cid:${emailIndex}:${attachmentIndex}`
  const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 16)
  return `${hash}@${MESSAGE_ID_DOMAIN}`
}
