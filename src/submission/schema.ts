import { Schema } from 'effect'
import { Id, UnsignedInt, JMAPDate, Comparator } from '../shared/common.ts'

/**
 * JMAP EmailSubmission schemas - RFC 8621 Section 7
 */

/**
 * Email address for envelope
 * Per RFC 8621: parameters is Object|null
 */
export const Address = Schema.Struct({
  email: Schema.String,
  parameters: Schema.NullOr(
    Schema.Record({
      key: Schema.String,
      value: Schema.NullOr(Schema.String)
    })
  )
})

export type Address = Schema.Schema.Type<typeof Address>

/**
 * SMTP Envelope for email submission
 */
export const Envelope = Schema.Struct({
  mailFrom: Address,
  rcptTo: Schema.Array(Address)
})

export type Envelope = Schema.Schema.Type<typeof Envelope>

/**
 * Undo status - indicates if a submission can be canceled
 */
export const UndoStatus = Schema.Literal('pending', 'final', 'canceled')

export type UndoStatus = Schema.Schema.Type<typeof UndoStatus>

/**
 * Delivery status for a single recipient
 */
export const DeliveryStatusValue = Schema.Struct({
  smtpReply: Schema.String,
  delivered: Schema.Literal('queued', 'yes', 'no', 'unknown'),
  displayed: Schema.Literal('unknown', 'yes', 'no')
})

export type DeliveryStatusValue = Schema.Schema.Type<typeof DeliveryStatusValue>

/**
 * Delivery status map - per-recipient delivery tracking
 */
export const DeliveryStatus = Schema.Record({
  key: Schema.String,
  value: DeliveryStatusValue
})

export type DeliveryStatus = Schema.Schema.Type<typeof DeliveryStatus>

/**
 * Core EmailSubmission object (full)
 * Per RFC 8621 Section 7: envelope and deliveryStatus are nullable (Type|null)
 * dsnBlobIds and mdnBlobIds are arrays (Id[]) - NOT nullable
 */
export const EmailSubmissionObject = Schema.Struct({
  id: Id,
  identityId: Id,
  emailId: Id,
  threadId: Id,
  envelope: Schema.NullOr(Envelope), // Envelope|null
  sendAt: JMAPDate,
  undoStatus: UndoStatus,
  deliveryStatus: Schema.NullOr(DeliveryStatus), // String[DeliveryStatus]|null
  dsnBlobIds: Schema.Array(Id), // Id[] - NOT nullable
  mdnBlobIds: Schema.Array(Id) // Id[] - NOT nullable
})

export type EmailSubmissionObject = Schema.Schema.Type<typeof EmailSubmissionObject>

/**
 * Minimal EmailSubmission object returned by EmailSubmission/set
 * Some JMAP servers (like Fastmail) only return a subset of fields
 */
export const EmailSubmissionSetResult = Schema.Struct({
  id: Id,
  identityId: Schema.optional(Id),
  emailId: Schema.optional(Id),
  threadId: Schema.optional(Id),
  envelope: Schema.optional(Schema.Union(Envelope, Schema.Null)),
  sendAt: Schema.optional(JMAPDate),
  undoStatus: Schema.optional(UndoStatus),
  deliveryStatus: Schema.optional(Schema.Union(DeliveryStatus, Schema.Null)),
  dsnBlobIds: Schema.optional(Schema.Array(Id)),
  mdnBlobIds: Schema.optional(Schema.Array(Id))
})

export type EmailSubmissionSetResult = Schema.Schema.Type<typeof EmailSubmissionSetResult>

/**
 * EmailSubmission properties that can be set during creation
 * Per RFC 8621: envelope is nullable, onSuccess* are optional
 */
export const EmailSubmissionMutable = Schema.Struct({
  identityId: Id,
  emailId: Id,
  envelope: Schema.optional(Schema.NullOr(Envelope)),
  sendAt: Schema.optional(JMAPDate),
  onSuccessUpdateEmail: Schema.optional(Schema.NullOr(
    Schema.Record({
      key: Schema.String,
      value: Schema.Any
    })
  )),
  onSuccessDestroyEmail: Schema.optional(Schema.NullOr(Schema.Union(Schema.Array(Id), Schema.Boolean)))
})

export type EmailSubmissionMutable = Schema.Schema.Type<typeof EmailSubmissionMutable>

/**
 * EmailSubmission filter conditions for query operations
 */
export const EmailSubmissionFilterCondition = Schema.Struct({
  identityIds: Schema.optional(Schema.Array(Id)),
  emailIds: Schema.optional(Schema.Array(Id)),
  threadIds: Schema.optional(Schema.Array(Id)),
  undoStatus: Schema.optional(UndoStatus),
  before: Schema.optional(JMAPDate),
  after: Schema.optional(JMAPDate)
})

export type EmailSubmissionFilterCondition = Schema.Schema.Type<typeof EmailSubmissionFilterCondition>

/**
 * Arguments for EmailSubmission/get method
 */
export const EmailSubmissionGetArguments = Schema.Struct({
  accountId: Schema.String,
  ids: Schema.Union(Schema.Array(Id), Schema.Null),
  properties: Schema.optional(Schema.Array(Schema.String))
})

export type EmailSubmissionGetArguments = Schema.Schema.Type<typeof EmailSubmissionGetArguments>

/**
 * Response for EmailSubmission/get method
 */
export const EmailSubmissionGetResponse = Schema.Struct({
  accountId: Schema.String,
  state: Schema.String,
  list: Schema.Array(EmailSubmissionObject),
  notFound: Schema.Array(Id)
})

export type EmailSubmissionGetResponse = Schema.Schema.Type<typeof EmailSubmissionGetResponse>

/**
 * Arguments for EmailSubmission/set method
 */
export const EmailSubmissionSetArguments = Schema.Struct({
  accountId: Schema.String,
  ifInState: Schema.optional(Schema.String),
  create: Schema.optional(Schema.Record({
    key: Schema.String,
    value: EmailSubmissionMutable
  })),
  update: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Struct({
      undoStatus: Schema.optional(UndoStatus)
    })
  })),
  destroy: Schema.optional(Schema.Array(Id))
})

export type EmailSubmissionSetArguments = Schema.Schema.Type<typeof EmailSubmissionSetArguments>

/**
 * Response for EmailSubmission/set method
 * Per RFC 8620 /set response: created, updated, destroyed, notCreated, notUpdated, notDestroyed
 * are nullable (Type|null) - they can be null if no operations of that type were requested
 */
export const EmailSubmissionSetResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  created: Schema.NullOr(
    Schema.Record({
      key: Schema.String,
      value: EmailSubmissionSetResult
    })
  ),
  updated: Schema.NullOr(
    Schema.Record({
      key: Id,
      value: Schema.NullOr(EmailSubmissionSetResult)
    })
  ),
  destroyed: Schema.NullOr(Schema.Array(Id)),
  notCreated: Schema.NullOr(
    Schema.Record({
      key: Schema.String,
      value: Schema.Any
    })
  ),
  notUpdated: Schema.NullOr(
    Schema.Record({
      key: Id,
      value: Schema.Any
    })
  ),
  notDestroyed: Schema.NullOr(
    Schema.Record({
      key: Id,
      value: Schema.Any
    })
  )
})

export type EmailSubmissionSetResponse = Schema.Schema.Type<typeof EmailSubmissionSetResponse>

/**
 * Arguments for EmailSubmission/query method
 */
export const EmailSubmissionQueryArguments = Schema.Struct({
  accountId: Schema.String,
  filter: Schema.optional(EmailSubmissionFilterCondition),
  sort: Schema.optional(Schema.Array(Comparator)),
  position: Schema.optional(UnsignedInt),
  anchor: Schema.optional(Id),
  anchorOffset: Schema.optional(Schema.Number),
  limit: Schema.optional(UnsignedInt),
  calculateTotal: Schema.optional(Schema.Boolean)
})

export type EmailSubmissionQueryArguments = Schema.Schema.Type<typeof EmailSubmissionQueryArguments>

/**
 * Response for EmailSubmission/query method
 */
export const EmailSubmissionQueryResponse = Schema.Struct({
  accountId: Schema.String,
  queryState: Schema.String,
  canCalculateChanges: Schema.Boolean,
  position: UnsignedInt,
  ids: Schema.Array(Id),
  total: Schema.optional(UnsignedInt),
  limit: Schema.optional(UnsignedInt)
})

export type EmailSubmissionQueryResponse = Schema.Schema.Type<typeof EmailSubmissionQueryResponse>

/**
 * Arguments for EmailSubmission/queryChanges method
 */
export const EmailSubmissionQueryChangesArguments = Schema.Struct({
  accountId: Schema.String,
  filter: Schema.optional(EmailSubmissionFilterCondition),
  sort: Schema.optional(Schema.Array(Comparator)),
  sinceQueryState: Schema.String,
  maxChanges: Schema.optional(UnsignedInt),
  upToId: Schema.optional(Id),
  calculateTotal: Schema.optional(Schema.Boolean)
})

export type EmailSubmissionQueryChangesArguments = Schema.Schema.Type<typeof EmailSubmissionQueryChangesArguments>

/**
 * Response for EmailSubmission/queryChanges method
 */
export const EmailSubmissionQueryChangesResponse = Schema.Struct({
  accountId: Schema.String,
  oldQueryState: Schema.String,
  newQueryState: Schema.String,
  total: Schema.optional(UnsignedInt),
  removed: Schema.Array(Id),
  added: Schema.Array(Schema.Struct({
    id: Id,
    index: UnsignedInt
  }))
})

export type EmailSubmissionQueryChangesResponse = Schema.Schema.Type<typeof EmailSubmissionQueryChangesResponse>

/**
 * Arguments for EmailSubmission/changes method
 */
export const EmailSubmissionChangesArguments = Schema.Struct({
  accountId: Schema.String,
  sinceState: Schema.String,
  maxChanges: Schema.optional(UnsignedInt)
})

export type EmailSubmissionChangesArguments = Schema.Schema.Type<typeof EmailSubmissionChangesArguments>

/**
 * Response for EmailSubmission/changes method
 */
export const EmailSubmissionChangesResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  hasMoreChanges: Schema.Boolean,
  created: Schema.Array(Id),
  updated: Schema.Array(Id),
  destroyed: Schema.Array(Id)
})

export type EmailSubmissionChangesResponse = Schema.Schema.Type<typeof EmailSubmissionChangesResponse>

/**
 * Helper functions for working with email submissions
 */
export const EmailSubmissionHelpers = {
  /**
   * Check if a submission is pending (can be canceled)
   */
  isPending: (submission: EmailSubmissionObject): boolean =>
    submission.undoStatus === 'pending',

  /**
   * Check if a submission is final (cannot be canceled)
   */
  isFinal: (submission: EmailSubmissionObject): boolean =>
    submission.undoStatus === 'final',

  /**
   * Check if a submission was canceled
   */
  isCanceled: (submission: EmailSubmissionObject): boolean =>
    submission.undoStatus === 'canceled',

  /**
   * Check if delivery has been attempted
   */
  isDelivered: (submission: EmailSubmissionObject): boolean =>
    submission.deliveryStatus !== null && submission.deliveryStatus !== undefined &&
    Object.keys(submission.deliveryStatus).length > 0,

  /**
   * Get delivery status for a specific recipient
   */
  getRecipientStatus: (submission: EmailSubmissionObject, email: string): DeliveryStatusValue | undefined =>
    submission.deliveryStatus?.[email],

  /**
   * Get all successfully delivered recipients
   */
  getDeliveredRecipients: (submission: EmailSubmissionObject): string[] => {
    if (!submission.deliveryStatus) return []
    return Object.entries(submission.deliveryStatus)
      .filter(([_, status]) => status.delivered === 'yes')
      .map(([email, _]) => email)
  },

  /**
   * Get all failed delivery recipients
   */
  getFailedRecipients: (submission: EmailSubmissionObject): string[] => {
    if (!submission.deliveryStatus) return []
    return Object.entries(submission.deliveryStatus)
      .filter(([_, status]) => status.delivered === 'no')
      .map(([email, _]) => email)
  },

  /**
   * Get all queued recipients (delivery pending)
   */
  getQueuedRecipients: (submission: EmailSubmissionObject): string[] => {
    if (!submission.deliveryStatus) return []
    return Object.entries(submission.deliveryStatus)
      .filter(([_, status]) => status.delivered === 'queued')
      .map(([email, _]) => email)
  },

  /**
   * Check if all recipients have been delivered successfully
   */
  isFullyDelivered: (submission: EmailSubmissionObject): boolean => {
    if (!submission.deliveryStatus) return false
    return Object.values(submission.deliveryStatus)
      .every(status => status.delivered === 'yes')
  },

  /**
   * Check if any recipient delivery failed
   */
  hasFailures: (submission: EmailSubmissionObject): boolean => {
    if (!submission.deliveryStatus) return false
    return Object.values(submission.deliveryStatus)
      .some(status => status.delivered === 'no')
  },

  /**
   * Create a simple envelope from email addresses
   */
  createEnvelope: (from: string, to: string[]): Envelope => ({
    mailFrom: { email: from, parameters: null },
    rcptTo: to.map(email => ({ email, parameters: null }))
  }),

  /**
   * Create submission mutable object for sending
   */
  createSubmission: (
    identityId: Id,
    emailId: Id,
    options?: {
      envelope?: Envelope | null;
      sendAt?: JMAPDate;
      onSuccessUpdateEmail?: Record<string, any> | null;
      onSuccessDestroyEmail?: Id[] | boolean | null;
    }
  ): EmailSubmissionMutable => ({
    identityId,
    emailId,
    envelope: options?.envelope,
    sendAt: options?.sendAt,
    onSuccessUpdateEmail: options?.onSuccessUpdateEmail,
    onSuccessDestroyEmail: options?.onSuccessDestroyEmail
  })
}
