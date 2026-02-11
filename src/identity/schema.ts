import { Schema } from 'effect'
import { Id, UnsignedInt, EmailAddress } from '../shared/common.ts'

/**
 * JMAP Identity schemas - RFC 8621 Section 6
 */

/**
 * Core Identity object (full)
 * Per RFC 8621 Section 6: replyTo and bcc are nullable (Type|null)
 * All nullable fields are also optional since servers may omit them entirely
 */
export const IdentityObject = Schema.Struct({
  id: Id,
  name: Schema.String,
  email: Schema.String,
  replyTo: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  bcc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  textSignature: Schema.String,
  htmlSignature: Schema.String,
  mayDelete: Schema.Boolean
})

export type IdentityObject = Schema.Schema.Type<typeof IdentityObject>

/**
 * Identity properties that can be set during creation
 * Per RFC 8621: email is creatable only; name, replyTo, bcc, textSignature,
 * htmlSignature are creatable and updatable
 */
export const IdentityMutable = Schema.Struct({
  name: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  replyTo: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  bcc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
  textSignature: Schema.optional(Schema.String),
  htmlSignature: Schema.optional(Schema.String)
})

export type IdentityMutable = Schema.Schema.Type<typeof IdentityMutable>

/**
 * Arguments for Identity/get method
 */
export const IdentityGetArguments = Schema.Struct({
  accountId: Schema.String,
  ids: Schema.Union(Schema.Array(Id), Schema.Null),
  properties: Schema.optional(Schema.Array(Schema.String))
})

export type IdentityGetArguments = Schema.Schema.Type<typeof IdentityGetArguments>

/**
 * Response for Identity/get method
 */
export const IdentityGetResponse = Schema.Struct({
  accountId: Schema.String,
  state: Schema.String,
  list: Schema.Array(IdentityObject),
  notFound: Schema.Array(Id)
})

export type IdentityGetResponse = Schema.Schema.Type<typeof IdentityGetResponse>

/**
 * Arguments for Identity/set method
 */
export const IdentitySetArguments = Schema.Struct({
  accountId: Schema.String,
  ifInState: Schema.optional(Schema.String),
  create: Schema.optional(Schema.Record({
    key: Schema.String,
    value: IdentityMutable
  })),
  update: Schema.optional(Schema.Record({
    key: Id,
    value: Schema.Struct({
      name: Schema.optional(Schema.String),
      replyTo: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
      bcc: Schema.optional(Schema.NullOr(Schema.Array(EmailAddress))),
      textSignature: Schema.optional(Schema.String),
      htmlSignature: Schema.optional(Schema.String)
    })
  })),
  destroy: Schema.optional(Schema.Array(Id))
})

export type IdentitySetArguments = Schema.Schema.Type<typeof IdentitySetArguments>

/**
 * Response for Identity/set method
 * All nullable fields are also optional since servers may omit them entirely
 */
export const IdentitySetResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  created: Schema.optional(Schema.NullOr(
    Schema.Record({
      key: Schema.String,
      value: Schema.Struct({
        id: Id,
        mayDelete: Schema.optional(Schema.Boolean)
      })
    })
  )),
  updated: Schema.optional(Schema.NullOr(
    Schema.Record({
      key: Id,
      value: Schema.NullOr(Schema.Any)
    })
  )),
  destroyed: Schema.optional(Schema.NullOr(Schema.Array(Id))),
  notCreated: Schema.optional(Schema.NullOr(
    Schema.Record({
      key: Schema.String,
      value: Schema.Any
    })
  )),
  notUpdated: Schema.optional(Schema.NullOr(
    Schema.Record({
      key: Id,
      value: Schema.Any
    })
  )),
  notDestroyed: Schema.optional(Schema.NullOr(
    Schema.Record({
      key: Id,
      value: Schema.Any
    })
  ))
})

export type IdentitySetResponse = Schema.Schema.Type<typeof IdentitySetResponse>

/**
 * Arguments for Identity/changes method
 */
export const IdentityChangesArguments = Schema.Struct({
  accountId: Schema.String,
  sinceState: Schema.String,
  maxChanges: Schema.optional(UnsignedInt)
})

export type IdentityChangesArguments = Schema.Schema.Type<typeof IdentityChangesArguments>

/**
 * Response for Identity/changes method
 */
export const IdentityChangesResponse = Schema.Struct({
  accountId: Schema.String,
  oldState: Schema.String,
  newState: Schema.String,
  hasMoreChanges: Schema.Boolean,
  created: Schema.Array(Id),
  updated: Schema.Array(Id),
  destroyed: Schema.Array(Id)
})

export type IdentityChangesResponse = Schema.Schema.Type<typeof IdentityChangesResponse>

/**
 * Helper functions for working with identities
 */
export const IdentityHelpers = {
  /**
   * Check if an identity can be deleted
   */
  canDelete: (identity: IdentityObject): boolean =>
    identity.mayDelete,

  /**
   * Check if an identity has a custom reply-to address
   */
  hasReplyTo: (identity: IdentityObject): boolean =>
    identity.replyTo !== null && identity.replyTo !== undefined && identity.replyTo.length > 0,

  /**
   * Check if an identity has auto-bcc configured
   */
  hasBcc: (identity: IdentityObject): boolean =>
    identity.bcc !== null && identity.bcc !== undefined && identity.bcc.length > 0,

  /**
   * Check if an identity has a text signature
   */
  hasTextSignature: (identity: IdentityObject): boolean =>
    identity.textSignature.length > 0,

  /**
   * Check if an identity has an HTML signature
   */
  hasHtmlSignature: (identity: IdentityObject): boolean =>
    identity.htmlSignature.length > 0,
}
