import { Schema } from 'effect'
import { Id, UnsignedInt, JMAPDate, EmailAddress, Keywords, Comparator } from '../shared/common.ts'

/**
 * JMAP Email schemas - RFC 8621 Section 4
 */

/**
 * Email Header structure
 */
export const EmailHeader = Schema.Struct({
  name: Schema.String,
  value: Schema.String
})

export type EmailHeader = Schema.Schema.Type<typeof EmailHeader>

/**
 * Email Headers - collection of header fields
 */
export const EmailHeaders = Schema.Record({
  key: Schema.String,
  value: Schema.Array(Schema.String)
})

export type EmailHeaders = Schema.Schema.Type<typeof EmailHeaders>

/**
 * Email Body Part structure for multipart messages
 * Per RFC 8621: partId and blobId are null for multipart/*, other properties are nullable
 * All nullable fields are also optional since servers may omit them entirely
 */
export const EmailBodyPart = Schema.Struct({
  partId: Schema.optional(Schema.NullOr(Schema.String)),
  blobId: Schema.optional(Schema.NullOr(Schema.String)),
  size: UnsignedInt,
  headers: Schema.optional(EmailHeaders),
  name: Schema.optional(Schema.NullOr(Schema.String)),
  type: Schema.String,
  charset: Schema.optional(Schema.NullOr(Schema.String)),
  disposition: Schema.optional(Schema.NullOr(Schema.String)),
  cid: Schema.optional(Schema.NullOr(Schema.String)),
  language: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  location: Schema.optional(Schema.NullOr(Schema.String)),
  subParts: Schema.optional(Schema.NullOr(Schema.Array(Schema.Any))) // Simplified to break circular reference
})

export type EmailBodyPart = Schema.Schema.Type<typeof EmailBodyPart>

/**
 * Email Body structure
 * Per RFC 8621: nullable properties match EmailBodyPart specification
 * All nullable fields are also optional since servers may omit them entirely
 */
export const EmailBody = Schema.Struct({
  type: Schema.String,
  subParts: Schema.optional(Schema.NullOr(Schema.Array(EmailBodyPart))),
  partId: Schema.optional(Schema.NullOr(Schema.String)),
  blobId: Schema.optional(Schema.NullOr(Schema.String)),
  size: UnsignedInt,
  name: Schema.optional(Schema.NullOr(Schema.String)),
  charset: Schema.optional(Schema.NullOr(Schema.String)),
  disposition: Schema.optional(Schema.NullOr(Schema.String)),
  cid: Schema.optional(Schema.NullOr(Schema.String)),
  language: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  location: Schema.optional(Schema.NullOr(Schema.String))
})

export type EmailBody = Schema.Schema.Type<typeof EmailBody>

/**
 * Email Body Values - text and HTML content
 */
export const EmailBodyValues = Schema.Record({
  key: Schema.String,
  value: Schema.Struct({
    value: Schema.String,
    isEncodingProblem: Schema.optional(Schema.Boolean),
    isTruncated: Schema.optional(Schema.Boolean)
  })
})

export type EmailBodyValues = Schema.Schema.Type<typeof EmailBodyValues>

/**
 * Email Attachment structure
 * Per RFC 8621: name, cid, disposition are nullable (String|null)
 * All nullable fields are also optional since servers may omit them entirely
 */
export const EmailAttachment = Schema.Struct({
  blobId: Schema.String,
  type: Schema.String,
  name: Schema.optional(Schema.NullOr(Schema.String)),
  size: UnsignedInt,
  cid: Schema.optional(Schema.NullOr(Schema.String)),
  disposition: Schema.optional(Schema.NullOr(Schema.String)),
  isInline: Schema.optional(Schema.Boolean)
})

export type EmailAttachment = Schema.Schema.Type<typeof EmailAttachment>

/**
 * Core Email object
 * Per RFC 8621 Section 4: Property types follow the spec's Type|null notation
 * All nullable fields are also optional since servers may omit them entirely
 */
export const Email = Schema.Struct({
  id: Id,
  blobId: Schema.String,
  threadId: Id,
  mailboxIds: Schema.Record({
    key: Id,
    value: Schema.Boolean
  }),
  keywords: Keywords,
  size: UnsignedInt,
  receivedAt: JMAPDate,
  sentAt: Schema.optional(Schema.NullOr(JMAPDate)),
  messageId: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  inReplyTo: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  references: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  sender: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  from: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  to: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  cc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  bcc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  replyTo: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  subject: Schema.optional(Schema.NullOr(Schema.String)),
  textBody: Schema.Array(EmailBodyPart),
  htmlBody: Schema.Array(EmailBodyPart),
  attachments: Schema.Array(EmailAttachment),
  hasAttachment: Schema.Boolean,
  preview: Schema.String,
  bodyValues: EmailBodyValues,
  headers: Schema.Array(EmailHeader)
})

export type Email = Schema.Schema.Type<typeof Email>

/**
 * Partial Email object for responses where specific properties are requested
 * All fields except 'id' are optional to handle partial responses from Email/get
 * Properties that are nullable per spec use Schema.NullOr, wrapped in Schema.optional
 * Properties that are NOT nullable per spec use Schema.optional directly
 */
export const PartialEmail = Schema.Struct({
  id: Id,
  blobId: Schema.optional(Schema.String),
  threadId: Schema.optional(Id),
  mailboxIds: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Boolean
  })),
  keywords: Schema.optional(Keywords),
  size: Schema.optional(UnsignedInt),
  receivedAt: Schema.optional(JMAPDate),
  sentAt: Schema.optional(Schema.NullOr(JMAPDate)), // Date|null
  messageId: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))), // String[]|null
  inReplyTo: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))), // String[]|null
  references: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))), // String[]|null
  sender: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))), // EmailAddress[]|null
  from: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))), // EmailAddress[]|null
  to: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))), // EmailAddress[]|null
  cc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))), // EmailAddress[]|null
  bcc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))), // EmailAddress[]|null
  replyTo: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))), // EmailAddress[]|null
  subject: Schema.optional(Schema.NullOr(Schema.String)), // String|null
  textBody: Schema.optional(Schema.Array(EmailBodyPart)),
  htmlBody: Schema.optional(Schema.Array(EmailBodyPart)),
  attachments: Schema.optional(Schema.Array(EmailAttachment)),
  hasAttachment: Schema.optional(Schema.Boolean),
  preview: Schema.optional(Schema.String),
  bodyValues: Schema.optional(EmailBodyValues),
  headers: Schema.optional(Schema.Array(EmailHeader))
})

export type PartialEmail = Schema.Schema.Type<typeof PartialEmail>


/**
 * Email filter conditions for query operations
 */
export const EmailFilterCondition = Schema.Struct({
  inMailbox: Schema.optional(Id),
  inMailboxOtherThan: Schema.optional(Schema.Array(Id)),
  before: Schema.optional(JMAPDate),
  after: Schema.optional(JMAPDate),
  minSize: Schema.optional(UnsignedInt),
  maxSize: Schema.optional(UnsignedInt),
  allInThreadHaveKeyword: Schema.optional(Schema.String),
  someInThreadHaveKeyword: Schema.optional(Schema.String),
  noneInThreadHaveKeyword: Schema.optional(Schema.String),
  hasKeyword: Schema.optional(Schema.String),
  notKeyword: Schema.optional(Schema.String),
  hasAttachment: Schema.optional(Schema.Boolean),
  text: Schema.optional(Schema.String),
  from: Schema.optional(Schema.String),
  to: Schema.optional(Schema.String),
  cc: Schema.optional(Schema.String),
  bcc: Schema.optional(Schema.String),
  subject: Schema.optional(Schema.String),
  body: Schema.optional(Schema.String),
  header: Schema.optional(Schema.Array(Schema.String))
})

export type EmailFilterCondition = Schema.Schema.Type<typeof EmailFilterCondition>

/**
 * Email properties that can be set during creation/update
 * Per RFC 8621: mailboxIds is required (Id[Boolean]), keywords has default {}
 */
export const EmailMutable = Schema.Struct({
  mailboxIds: Schema.Record({
    key: Id,
    value: Schema.Boolean
  }),
  keywords: Schema.optional(Keywords)
})

export type EmailMutable = Schema.Schema.Type<typeof EmailMutable>

/**
 * Arguments for Email/get method
 */
export const EmailGetArguments = Schema.Struct({
  accountId: Schema.String,
  ids: Schema.Union(Schema.Array(Id), Schema.Null),
  properties: Schema.optional(Schema.Array(Schema.String)),
  bodyProperties: Schema.optional(Schema.Array(Schema.String)),
  fetchTextBodyValues: Schema.optional(Schema.Boolean),
  fetchHTMLBodyValues: Schema.optional(Schema.Boolean),
  fetchAllBodyValues: Schema.optional(Schema.Boolean),
  maxBodyValueBytes: Schema.optional(UnsignedInt)
})

export type EmailGetArguments = Schema.Schema.Type<typeof EmailGetArguments>

/**
 * Response for Email/get method
 */
export const EmailGetResponse = Schema.Struct({
  accountId: Schema.String,
  state: Schema.String,
  list: Schema.Array(Schema.Union(Email, PartialEmail)),
  notFound: Schema.Array(Id)
})

export type EmailGetResponse = Schema.Schema.Type<typeof EmailGetResponse>

/**
 * Arguments for Email/set method
 */
export const EmailSetArguments = Schema.Struct({
  accountId: Schema.String,
  ifInState: Schema.optional(Schema.String),
  create: Schema.optional(Schema.Record({
    key: Schema.String,
    value: EmailMutable
  })),
  update: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.partial(EmailMutable)
  })),
  destroy: Schema.optional(Schema.Array(Id))
})

export type EmailSetArguments = Schema.Schema.Type<typeof EmailSetArguments>

/**
 * Response for Email/set method
 * All nullable fields are also optional since servers may omit them entirely
 */
export const EmailSetResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  created: Schema.optional(Schema.NullOr(Schema.Record({
    key: Schema.String,
    value: Email
  }))),
  updated: Schema.optional(Schema.NullOr(Schema.Record({
    key: Id,
    value: Schema.NullOr(Email)
  }))),
  destroyed: Schema.optional(Schema.NullOr(Schema.Array(Id))),
  notCreated: Schema.optional(Schema.NullOr(Schema.Record({
    key: Schema.String,
    value: Schema.Any
  }))),
  notUpdated: Schema.optional(Schema.NullOr(Schema.Record({
    key: Id,
    value: Schema.Any
  }))),
  notDestroyed: Schema.optional(Schema.NullOr(Schema.Record({
    key: Id,
    value: Schema.Any
  })))
})

export type EmailSetResponse = Schema.Schema.Type<typeof EmailSetResponse>

/**
 * Arguments for Email/query method
 */
export const EmailQueryArguments = Schema.Struct({
  accountId: Schema.String,
  filter: Schema.optional(EmailFilterCondition),
  sort: Schema.optional(Schema.Array(Comparator)),
  position: Schema.optional(UnsignedInt),
  anchor: Schema.optional(Id),
  anchorOffset: Schema.optional(Schema.Number),
  limit: Schema.optional(UnsignedInt),
  calculateTotal: Schema.optional(Schema.Boolean),
  collapseThreads: Schema.optional(Schema.Boolean)
})

export type EmailQueryArguments = Schema.Schema.Type<typeof EmailQueryArguments>

/**
 * Response for Email/query method
 */
export const EmailQueryResponse = Schema.Struct({
  accountId: Schema.String,
  queryState: Schema.String,
  canCalculateChanges: Schema.Boolean,
  position: UnsignedInt,
  ids: Schema.Array(Id),
  total: Schema.optional(UnsignedInt),
  limit: Schema.optional(UnsignedInt),
  collapseThreads: Schema.optional(Schema.Boolean)
})

export type EmailQueryResponse = Schema.Schema.Type<typeof EmailQueryResponse>

/**
 * Arguments for Email/queryChanges method
 */
export const EmailQueryChangesArguments = Schema.Struct({
  accountId: Schema.String,
  filter: Schema.optional(EmailFilterCondition),
  sort: Schema.optional(Schema.Array(Comparator)),
  sinceQueryState: Schema.String,
  maxChanges: Schema.optional(UnsignedInt),
  upToId: Schema.optional(Id),
  calculateTotal: Schema.optional(Schema.Boolean),
  collapseThreads: Schema.optional(Schema.Boolean)
})

export type EmailQueryChangesArguments = Schema.Schema.Type<typeof EmailQueryChangesArguments>

/**
 * Response for Email/queryChanges method
 */
export const EmailQueryChangesResponse = Schema.Struct({
  accountId: Schema.String,
  oldQueryState: Schema.String,
  newQueryState: Schema.String,
  total: Schema.optional(UnsignedInt),
  removed: Schema.Array(Id),
  added: Schema.Array(Schema.Struct({
    id: Id,
    index: UnsignedInt
  })),
  collapseThreads: Schema.optional(Schema.Boolean)
})

export type EmailQueryChangesResponse = Schema.Schema.Type<typeof EmailQueryChangesResponse>

/**
 * Arguments for Email/copy method
 */
export const EmailCopyArguments = Schema.Struct({
  fromAccountId: Schema.String,
  accountId: Schema.String,
  create: Schema.Record({
    key: Schema.String,
    value: Schema.Struct({
      id: Id,
      mailboxIds: Schema.Record({
        key: Id,
        value: Schema.Boolean
      }),
      keywords: Schema.optional(Keywords)
    })
  }),
  onSuccessDestroyOriginal: Schema.optional(Schema.Boolean),
  destroyFromIfInState: Schema.optional(Schema.String)
})

export type EmailCopyArguments = Schema.Schema.Type<typeof EmailCopyArguments>

/**
 * Response for Email/copy method
 */
export const EmailCopyResponse = Schema.Struct({
  fromAccountId: Schema.String,
  accountId: Schema.String,
  oldState: Schema.optional(Schema.String),
  newState: Schema.String,
  created: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Email
  })),
  notCreated: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Any
  }))
})

export type EmailCopyResponse = Schema.Schema.Type<typeof EmailCopyResponse>

/**
 * Arguments for Email/import method
 */
export const EmailImportArguments = Schema.Struct({
  accountId: Schema.String,
  ifInState: Schema.optional(Schema.String),
  emails: Schema.Record({
    key: Schema.String,
    value: Schema.Struct({
      blobId: Schema.String,
      mailboxIds: Schema.Record({
        key: Id,
        value: Schema.Boolean
      }),
      keywords: Schema.optional(Keywords),
      receivedAt: Schema.optional(JMAPDate)
    })
  })
})

export type EmailImportArguments = Schema.Schema.Type<typeof EmailImportArguments>

/**
 * Minimal Email object returned by Email/import
 * According to JMAP spec, Email/import only returns: id, blobId, threadId, size
 */
export const EmailImportResult = Schema.Struct({
  id: Id,
  blobId: Schema.String,
  threadId: Id,
  size: UnsignedInt
})

export type EmailImportResult = Schema.Schema.Type<typeof EmailImportResult>

/**
 * Response for Email/import method
 */
export const EmailImportResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  created: Schema.optional(Schema.Record({
    key: Schema.String,
    value: EmailImportResult
  })),
  notCreated: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Any
  }))
})

export type EmailImportResponse = Schema.Schema.Type<typeof EmailImportResponse>

/**
 * Arguments for Email/changes method
 * Per RFC 8621 Section 4.6: Standard /changes method for tracking email state changes
 */
export const EmailChangesArguments = Schema.Struct({
  accountId: Schema.String,
  sinceState: Schema.String,
  maxChanges: Schema.optional(UnsignedInt)
})

export type EmailChangesArguments = Schema.Schema.Type<typeof EmailChangesArguments>

/**
 * Response for Email/changes method
 * Per RFC 8621: Returns lists of created, updated, and destroyed email IDs
 */
export const EmailChangesResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  hasMoreChanges: Schema.Boolean,
  created: Schema.Array(Id),
  updated: Schema.Array(Id),
  destroyed: Schema.Array(Id)
})

export type EmailChangesResponse = Schema.Schema.Type<typeof EmailChangesResponse>

/**
 * Arguments for Email/parse method
 * Per RFC 8621 Section 4.8: Parse blob data as RFC 5322 messages
 */
export const EmailParseArguments = Schema.Struct({
  accountId: Schema.String,
  blobIds: Schema.Array(Schema.String),
  properties: Schema.optional(Schema.Array(Schema.String)),
  bodyProperties: Schema.optional(Schema.Array(Schema.String)),
  fetchTextBodyValues: Schema.optional(Schema.Boolean),
  fetchHTMLBodyValues: Schema.optional(Schema.Boolean),
  fetchAllBodyValues: Schema.optional(Schema.Boolean),
  maxBodyValueBytes: Schema.optional(UnsignedInt)
})

export type EmailParseArguments = Schema.Schema.Type<typeof EmailParseArguments>

/**
 * Parsed email object returned by Email/parse
 * This is similar to Email but with some differences:
 * - id is the blobId that was parsed (not a real email ID)
 * - Some server-computed fields may be missing
 * Per RFC 8621: All nullable fields follow the same pattern as Email
 */
export const ParsedEmail = Schema.Struct({
  // The blobId that was parsed
  blobId: Schema.optional(Schema.String),
  // Size of the raw message
  size: Schema.optional(UnsignedInt),
  // Headers
  headers: Schema.optional(Schema.Array(EmailHeader)),
  // Message-ID header
  messageId: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  // In-Reply-To header
  inReplyTo: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  // References header
  references: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  // Sender header
  sender: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  // From header
  from: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  // To header
  to: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  // Cc header
  cc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  // Bcc header
  bcc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  // Reply-To header
  replyTo: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  // Subject header
  subject: Schema.optional(Schema.NullOr(Schema.String)),
  // Date header parsed as date
  sentAt: Schema.optional(Schema.NullOr(JMAPDate)),
  // Body structure
  bodyStructure: Schema.optional(EmailBodyPart),
  // Text body parts
  textBody: Schema.optional(Schema.Array(EmailBodyPart)),
  // HTML body parts
  htmlBody: Schema.optional(Schema.Array(EmailBodyPart)),
  // Attachments
  attachments: Schema.optional(Schema.Array(EmailAttachment)),
  // Has attachment flag
  hasAttachment: Schema.optional(Schema.Boolean),
  // Preview text
  preview: Schema.optional(Schema.String),
  // Body values (content)
  bodyValues: Schema.optional(EmailBodyValues)
})

export type ParsedEmail = Schema.Schema.Type<typeof ParsedEmail>

/**
 * Response for Email/parse method
 * Per RFC 8621: Returns parsed email objects keyed by blob ID
 */
export const EmailParseResponse = Schema.Struct({
  accountId: Schema.String,
  parsed: Schema.optional(Schema.NullOr(Schema.Record({
    key: Schema.String,
    value: ParsedEmail
  }))),
  notParsable: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  notFound: Schema.optional(Schema.NullOr(Schema.Array(Schema.String)))
})

export type EmailParseResponse = Schema.Schema.Type<typeof EmailParseResponse>

/**
 * Standard email properties for convenience
 */
export const StandardProperties = {
  METADATA: ['id', 'blobId', 'threadId', 'mailboxIds', 'keywords', 'size', 'receivedAt', 'hasAttachment', 'preview'],
  ENVELOPE: ['id', 'threadId', 'subject', 'from', 'to', 'cc', 'bcc', 'replyTo', 'sentAt', 'receivedAt'],
  FULL: null // null means all properties
} as const

/**
 * Helper functions for working with emails
 */
export const EmailHelpers = {
  /**
   * Check if an email has a specific keyword
   */
  hasKeyword: (email: Email, keyword: string): boolean =>
    email.keywords ? Boolean(email.keywords[keyword]) : false,

  /**
   * Check if an email is seen/read
   */
  isSeen: (email: Email): boolean =>
    EmailHelpers.hasKeyword(email, '$seen'),

  /**
   * Check if an email is flagged
   */
  isFlagged: (email: Email): boolean =>
    EmailHelpers.hasKeyword(email, '$flagged'),

  /**
   * Check if an email is a draft
   */
  isDraft: (email: Email): boolean =>
    EmailHelpers.hasKeyword(email, '$draft'),

  /**
   * Check if an email has been answered
   */
  isAnswered: (email: Email): boolean =>
    EmailHelpers.hasKeyword(email, '$answered'),

  /**
   * Check if an email has been forwarded
   */
  isForwarded: (email: Email): boolean =>
    EmailHelpers.hasKeyword(email, '$forwarded'),

  /**
   * Check if an email has attachments
   */
  hasAttachments: (email: Email): boolean =>
    email.hasAttachment === true || (email.attachments && email.attachments.length > 0) || false,

  /**
   * Get all mailbox IDs where this email exists
   */
  getMailboxIds: (email: Email): Id[] =>
    Object.keys(email.mailboxIds).filter(id => email.mailboxIds[id as Id]) as Id[],

  /**
   * Check if an email is in a specific mailbox
   */
  isInMailbox: (email: Email, mailboxId: Id): boolean =>
    Boolean(email.mailboxIds[mailboxId]),

  /**
   * Get email sender (first sender or from address)
   */
  getSenderEmail: (email: Email): string | undefined => {
    if (email.sender && email.sender.length > 0) {
      return email.sender[0]?.email
    }
    if (email.from && email.from.length > 0) {
      return email.from[0]?.email
    }
    return undefined
  },

  /**
   * Get email sender name
   */
  getSenderName: (email: Email): string | undefined => {
    if (email.sender && email.sender.length > 0) {
      return email.sender[0]?.name || email.sender[0]?.email
    }
    if (email.from && email.from.length > 0) {
      return email.from[0]?.name || email.from[0]?.email
    }
    return undefined
  },

  /**
   * Get all recipient email addresses
   */
  getAllRecipients: (email: Email): EmailAddress[] => {
    const recipients: EmailAddress[] = []
    if (email.to) recipients.push(...email.to)
    if (email.cc) recipients.push(...email.cc)
    if (email.bcc) recipients.push(...email.bcc)
    return recipients
  },

  /**
   * Check if email has text body content
   */
  hasTextBody: (email: Email): boolean =>
    Boolean(email.textBody && email.textBody.length > 0),

  /**
   * Check if email has HTML body content
   */
  hasHTMLBody: (email: Email): boolean =>
    Boolean(email.htmlBody && email.htmlBody.length > 0),

  /**
   * Get the main text content from body values
   */
  getTextContent: (email: Email): string | undefined => {
    if (!email.bodyValues) return undefined

    // Look for text/plain content
    for (const [partId, bodyValue] of Object.entries(email.bodyValues)) {
      if (email.textBody?.some(part => part.partId === partId)) {
        return bodyValue.value
      }
    }
    return undefined
  },

  /**
   * Get the main HTML content from body values
   */
  getHTMLContent: (email: Email): string | undefined => {
    if (!email.bodyValues) return undefined

    // Look for text/html content
    for (const [partId, bodyValue] of Object.entries(email.bodyValues)) {
      if (email.htmlBody?.some(part => part.partId === partId)) {
        return bodyValue.value
      }
    }
    return undefined
  },

  /**
   * Get formatted email content with both text and HTML
   */
  getFormattedContent: (email: Email): {
    text?: string;
    html?: string;
    hasContent: boolean;
    isTruncated: boolean;
    hasEncodingProblem: boolean;
  } => {
    const textContent = EmailHelpers.getTextContent(email)
    const htmlContent = EmailHelpers.getHTMLContent(email)

    let isTruncated = false
    let hasEncodingProblem = false

    if (email.bodyValues) {
      for (const bodyValue of Object.values(email.bodyValues)) {
        if (bodyValue.isTruncated) isTruncated = true
        if (bodyValue.isEncodingProblem) hasEncodingProblem = true
      }
    }

    const result: {
      text?: string;
      html?: string;
      hasContent: boolean;
      isTruncated: boolean;
      hasEncodingProblem: boolean;
    } = {
      hasContent: Boolean(textContent || htmlContent),
      isTruncated,
      hasEncodingProblem,
    }

    if (textContent !== undefined) {
      result.text = textContent
    }
    if (htmlContent !== undefined) {
      result.html = htmlContent
    }

    return result
  },

  /**
   * Get all body part content indexed by partId
   */
  getAllBodyContent: (email: Email): Record<string, {
    value: string;
    type?: string;
    isTruncated?: boolean;
    isEncodingProblem?: boolean;
  }> => {
    if (!email.bodyValues) return {}

    const allContent: Record<string, any> = {}

    for (const [partId, bodyValue] of Object.entries(email.bodyValues)) {
      // Find the corresponding body part to get the type
      let partType: string | undefined

      const textPart = email.textBody?.find(part => part.partId === partId)
      const htmlPart = email.htmlBody?.find(part => part.partId === partId)

      if (textPart) partType = textPart.type || 'text/plain'
      if (htmlPart) partType = htmlPart.type || 'text/html'

      allContent[partId] = {
        value: bodyValue.value,
        type: partType,
        isTruncated: bodyValue.isTruncated,
        isEncodingProblem: bodyValue.isEncodingProblem,
      }
    }

    return allContent
  },

  /**
   * Extract inline attachments (images with cid)
   * Per RFC 8621: cid is String|null, so we check for truthy cid value
   */
  getInlineAttachments: (email: Email): EmailAttachment[] =>
    email.attachments.filter(att => att.isInline === true || (att.cid != null && att.cid !== '')),

  /**
   * Extract regular attachments (non-inline)
   * Per RFC 8621: cid is String|null, so we check for null/empty cid
   */
  getRegularAttachments: (email: Email): EmailAttachment[] =>
    email.attachments.filter(att => att.isInline !== true && (att.cid == null || att.cid === '')),

  /**
   * Create keywords object from array of keyword strings
   */
  createKeywords: (keywords: string[]): Keywords =>
    keywords.reduce((acc, keyword) => ({...acc, [keyword]: true}), {} as Keywords),

  /**
   * Convert keywords object to array of active keyword strings
   */
  keywordsToArray: (keywords: Keywords): string[] =>
    Object.entries(keywords).filter(([_, active]) => active).map(([keyword, _]) => keyword)
}