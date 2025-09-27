import { Schema } from 'effect'
import { Id, UnsignedInt, JMAPDate, Rights } from './Common.js'

/**
 * JMAP Mailbox schemas - RFC 8621 Section 2
 */

/**
 * Mailbox roles as defined by RFC 8621
 */
export const MailboxRole = Schema.Literal(
  'inbox',
  'archive',
  'drafts',
  'outbox',
  'sent',
  'trash',
  'junk',
  'important',
  'subscribed',
  'all',
  'flagged'
)

export type MailboxRole = Schema.Schema.Type<typeof MailboxRole>

/**
 * Mailbox rights - permissions for accessing a mailbox
 */
export const MailboxRights = Schema.Struct({
  mayReadItems: Schema.Boolean,
  mayAddItems: Schema.Boolean,
  mayRemoveItems: Schema.Boolean,
  maySetSeen: Schema.Boolean,
  maySetKeywords: Schema.Boolean,
  mayCreateChild: Schema.Boolean,
  mayRename: Schema.Boolean,
  mayDelete: Schema.Boolean,
  maySubmit: Schema.Boolean
})

export type MailboxRights = Schema.Schema.Type<typeof MailboxRights>

/**
 * Core Mailbox object
 */
export const Mailbox = Schema.Struct({
  id: Id,
  name: Schema.String,
  parentId: Schema.Union(Id, Schema.Null),
  role: Schema.Union(MailboxRole, Schema.Null),
  sortOrder: UnsignedInt,
  totalEmails: UnsignedInt,
  unreadEmails: UnsignedInt,
  totalThreads: UnsignedInt,
  unreadThreads: UnsignedInt,
  myRights: MailboxRights,
  isSubscribed: Schema.Boolean
})

export type Mailbox = Schema.Schema.Type<typeof Mailbox>

/**
 * Mailbox filter for query operations
 */
export const MailboxFilterCondition = Schema.Struct({
  parentId: Schema.optional(Schema.Union(Id, Schema.Null)),
  name: Schema.optional(Schema.String),
  role: Schema.optional(Schema.Union(MailboxRole, Schema.Null)),
  hasAnyRole: Schema.optional(Schema.Boolean),
  isSubscribed: Schema.optional(Schema.Boolean),
  hasChild: Schema.optional(Schema.Union(Id, Schema.Null)),
  hasParent: Schema.optional(Schema.Union(Id, Schema.Null))
})

export type MailboxFilterCondition = Schema.Schema.Type<typeof MailboxFilterCondition>

/**
 * Mailbox properties that can be set during creation/update
 */
export const MailboxMutable = Schema.Struct({
  name: Schema.optional(Schema.String),
  parentId: Schema.optional(Schema.Union(Id, Schema.Null)),
  role: Schema.optional(Schema.Union(MailboxRole, Schema.Null)),
  sortOrder: Schema.optional(UnsignedInt),
  isSubscribed: Schema.optional(Schema.Boolean)
})

export type MailboxMutable = Schema.Schema.Type<typeof MailboxMutable>

/**
 * Arguments for Mailbox/get method
 */
export const MailboxGetArguments = Schema.Struct({
  accountId: Schema.String,
  ids: Schema.Union(Schema.Array(Id), Schema.Null),
  properties: Schema.optional(Schema.Array(Schema.String))
})

export type MailboxGetArguments = Schema.Schema.Type<typeof MailboxGetArguments>

/**
 * Response for Mailbox/get method
 */
export const MailboxGetResponse = Schema.Struct({
  accountId: Schema.String,
  state: Schema.String,
  list: Schema.Array(Mailbox),
  notFound: Schema.Array(Id)
})

export type MailboxGetResponse = Schema.Schema.Type<typeof MailboxGetResponse>

/**
 * Arguments for Mailbox/set method
 */
export const MailboxSetArguments = Schema.Struct({
  accountId: Schema.String,
  ifInState: Schema.optional(Schema.String),
  create: Schema.optional(Schema.Record({
    key: Schema.String,
    value: MailboxMutable
  })),
  update: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.partial(MailboxMutable)
  })),
  destroy: Schema.optional(Schema.Array(Id))
})

export type MailboxSetArguments = Schema.Schema.Type<typeof MailboxSetArguments>

/**
 * Response for Mailbox/set method
 */
export const MailboxSetResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  created: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Mailbox
  })),
  updated: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Union(Mailbox, Schema.Null)
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

export type MailboxSetResponse = Schema.Schema.Type<typeof MailboxSetResponse>

/**
 * Arguments for Mailbox/query method
 */
export const MailboxQueryArguments = Schema.Struct({
  accountId: Schema.String,
  filter: Schema.optional(MailboxFilterCondition),
  sort: Schema.optional(Schema.Array(Schema.Struct({
    property: Schema.String,
    isAscending: Schema.optional(Schema.Boolean)
  }))),
  position: Schema.optional(UnsignedInt),
  anchor: Schema.optional(Id),
  anchorOffset: Schema.optional(Schema.Number),
  limit: Schema.optional(UnsignedInt),
  calculateTotal: Schema.optional(Schema.Boolean)
})

export type MailboxQueryArguments = Schema.Schema.Type<typeof MailboxQueryArguments>

/**
 * Response for Mailbox/query method
 */
export const MailboxQueryResponse = Schema.Struct({
  accountId: Schema.String,
  queryState: Schema.String,
  canCalculateChanges: Schema.Boolean,
  position: UnsignedInt,
  ids: Schema.Array(Id),
  total: Schema.optional(UnsignedInt),
  limit: Schema.optional(UnsignedInt)
})

export type MailboxQueryResponse = Schema.Schema.Type<typeof MailboxQueryResponse>

/**
 * Arguments for Mailbox/queryChanges method
 */
export const MailboxQueryChangesArguments = Schema.Struct({
  accountId: Schema.String,
  filter: Schema.optional(MailboxFilterCondition),
  sort: Schema.optional(Schema.Array(Schema.Struct({
    property: Schema.String,
    isAscending: Schema.optional(Schema.Boolean)
  }))),
  sinceQueryState: Schema.String,
  maxChanges: Schema.optional(UnsignedInt),
  upToId: Schema.optional(Id),
  calculateTotal: Schema.optional(Schema.Boolean)
})

export type MailboxQueryChangesArguments = Schema.Schema.Type<typeof MailboxQueryChangesArguments>

/**
 * Response for Mailbox/queryChanges method
 */
export const MailboxQueryChangesResponse = Schema.Struct({
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

export type MailboxQueryChangesResponse = Schema.Schema.Type<typeof MailboxQueryChangesResponse>

/**
 * Standard mailbox roles for convenience
 */
export const StandardRoles = {
  INBOX: 'inbox' as const,
  ARCHIVE: 'archive' as const,
  DRAFTS: 'drafts' as const,
  OUTBOX: 'outbox' as const,
  SENT: 'sent' as const,
  TRASH: 'trash' as const,
  JUNK: 'junk' as const,
  IMPORTANT: 'important' as const,
  SUBSCRIBED: 'subscribed' as const,
  ALL: 'all' as const,
  FLAGGED: 'flagged' as const
} as const

/**
 * Helper functions for working with mailboxes
 */
export const MailboxHelpers = {
  /**
   * Check if a mailbox has a specific role
   */
  hasRole: (mailbox: Mailbox, role: MailboxRole): boolean =>
    mailbox.role === role,

  /**
   * Check if a mailbox is a system mailbox (has a role)
   */
  isSystemMailbox: (mailbox: Mailbox): boolean =>
    mailbox.role !== null,

  /**
   * Check if a mailbox allows creating child mailboxes
   */
  canCreateChild: (mailbox: Mailbox): boolean =>
    mailbox.myRights.mayCreateChild,

  /**
   * Check if a mailbox can be renamed
   */
  canRename: (mailbox: Mailbox): boolean =>
    mailbox.myRights.mayRename,

  /**
   * Check if a mailbox can be deleted
   */
  canDelete: (mailbox: Mailbox): boolean =>
    mailbox.myRights.mayDelete,

  /**
   * Get the depth level of a mailbox in the hierarchy
   */
  getDepth: (mailbox: Mailbox, allMailboxes: Mailbox[]): number => {
    let depth = 0
    let current: Mailbox | undefined = mailbox

    while (current && current.parentId) {
      depth++
      current = allMailboxes.find(m => m.id === current!.parentId)
    }

    return depth
  },

  /**
   * Get all child mailboxes of a given mailbox
   */
  getChildren: (parentId: Id, allMailboxes: Mailbox[]): Mailbox[] =>
    allMailboxes.filter(m => m.parentId === parentId),

  /**
   * Get all ancestor mailboxes of a given mailbox
   */
  getAncestors: (mailbox: Mailbox, allMailboxes: Mailbox[]): Mailbox[] => {
    const ancestors: Mailbox[] = []
    let current = mailbox

    while (current.parentId) {
      const parent = allMailboxes.find(m => m.id === current.parentId)
      if (!parent) break
      ancestors.unshift(parent)
      current = parent
    }

    return ancestors
  }
}