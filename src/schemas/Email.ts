import { Schema } from 'effect'
import { Id, UnsignedInt, JMAPDate, EmailAddress, Keywords, Comparator } from './Common.ts'

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
 */
export const EmailBodyPart = Schema.Struct({
  partId: Schema.optional(Schema.String),
  blobId: Schema.optional(Schema.String),
  size: Schema.optional(UnsignedInt),
  headers: Schema.optional(EmailHeaders),
  name: Schema.optional(Schema.String),
  type: Schema.optional(Schema.String),
  charset: Schema.optional(Schema.String),
  disposition: Schema.optional(Schema.String),
  cid: Schema.optional(Schema.String),
  language: Schema.optional(Schema.Array(Schema.String)),
  location: Schema.optional(Schema.String),
  subParts: Schema.optional(Schema.Array(Schema.Any)) // Simplified to break circular reference
})

export type EmailBodyPart = Schema.Schema.Type<typeof EmailBodyPart>

/**
 * Email Body structure
 */
export const EmailBody = Schema.Struct({
  type: Schema.String,
  subParts: Schema.optional(Schema.Array(EmailBodyPart)),
  partId: Schema.optional(Schema.String),
  blobId: Schema.optional(Schema.String),
  size: Schema.optional(UnsignedInt),
  name: Schema.optional(Schema.String),
  charset: Schema.optional(Schema.String),
  disposition: Schema.optional(Schema.String),
  cid: Schema.optional(Schema.String),
  language: Schema.optional(Schema.Array(Schema.String)),
  location: Schema.optional(Schema.String)
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
 */
export const EmailAttachment = Schema.Struct({
  blobId: Schema.String,
  type: Schema.String,
  name: Schema.optional(Schema.String),
  size: UnsignedInt,
  cid: Schema.optional(Schema.String),
  disposition: Schema.optional(Schema.String),
  isInline: Schema.optional(Schema.Boolean)
})

export type EmailAttachment = Schema.Schema.Type<typeof EmailAttachment>

/**
 * Core Email object
 */
export const Email = Schema.Struct({
  id: Id,
  blobId: Schema.String,
  threadId: Id,
  mailboxIds: Schema.Record({
    key: Id,
    value: Schema.Boolean
  }),
  keywords: Schema.optional(Keywords),
  size: UnsignedInt,
  receivedAt: JMAPDate,
  sentAt: Schema.optional(JMAPDate),
  messageId: Schema.optional(Schema.Array(Schema.String)),
  inReplyTo: Schema.optional(Schema.Array(Schema.String)),
  references: Schema.optional(Schema.Array(Schema.String)),
  sender: Schema.optional(Schema.Array(EmailAddress)),
  from: Schema.optional(Schema.Array(EmailAddress)),
  to: Schema.optional(Schema.Array(EmailAddress)),
  cc: Schema.optional(Schema.Array(EmailAddress)),
  bcc: Schema.optional(Schema.Array(EmailAddress)),
  replyTo: Schema.optional(Schema.Array(EmailAddress)),
  subject: Schema.optional(Schema.String),
  textBody: Schema.optional(Schema.Array(EmailBodyPart)),
  htmlBody: Schema.optional(Schema.Array(EmailBodyPart)),
  attachments: Schema.optional(Schema.Array(EmailAttachment)),
  hasAttachment: Schema.optional(Schema.Boolean),
  preview: Schema.optional(Schema.String),
  bodyValues: Schema.optional(EmailBodyValues),
  headers: Schema.optional(EmailHeaders)
})

export type Email = Schema.Schema.Type<typeof Email>

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
 */
export const EmailMutable = Schema.Struct({
  mailboxIds: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Boolean
  })),
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
  list: Schema.Array(Email),
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
 */
export const EmailSetResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  created: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Email
  })),
  updated: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Union(Email, Schema.Null)
  })),
  destroyed: Schema.optional(Schema.Array(Id)),
  notCreated: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Any
  })),
  notUpdated: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Any
  })),
  notDestroyed: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Any
  }))
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
 * Response for Email/import method
 */
export const EmailImportResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
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

export type EmailImportResponse = Schema.Schema.Type<typeof EmailImportResponse>

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
      if (email.textBody?.some(part => (part as any)?.partId === partId)) {
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
      if (email.htmlBody?.some(part => (part as any)?.partId === partId)) {
        return bodyValue.value
      }
    }
    return undefined
  },

  /**
   * Extract inline attachments (images with cid)
   */
  getInlineAttachments: (email: Email): EmailAttachment[] =>
    email.attachments?.filter(att => att.isInline === true || att.cid !== undefined) || [],

  /**
   * Extract regular attachments (non-inline)
   */
  getRegularAttachments: (email: Email): EmailAttachment[] =>
    email.attachments?.filter(att => att.isInline !== true && att.cid === undefined) || [],

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