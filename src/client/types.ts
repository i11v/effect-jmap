import { Schema } from 'effect'

/**
 * JMAP Core Types - RFC 8621
 */

/**
 * Capability object defining what operations the server supports
 */
export const Capability = Schema.Struct({
  maxSizeUpload: Schema.optional(Schema.Number),
  maxConcurrentUpload: Schema.optional(Schema.Number),
  maxSizeRequest: Schema.optional(Schema.Number),
  maxConcurrentRequests: Schema.optional(Schema.Number),
  maxCallsInRequest: Schema.optional(Schema.Number),
  maxObjectsInGet: Schema.optional(Schema.Number),
  maxObjectsInSet: Schema.optional(Schema.Number),
  collationAlgorithms: Schema.optional(Schema.Array(Schema.String))
})

export type Capability = Schema.Schema.Type<typeof Capability>

/**
 * Account object containing account information
 */
export const Account = Schema.Struct({
  name: Schema.String,
  isPersonal: Schema.Boolean,
  isReadOnly: Schema.Boolean,
  accountCapabilities: Schema.Record({
    key: Schema.String,
    value: Schema.Record({ key: Schema.String, value: Schema.Any })
  })
})

export type Account = Schema.Schema.Type<typeof Account>

/**
 * Session object returned from session endpoint
 */
export const Session = Schema.Struct({
  capabilities: Schema.Record({
    key: Schema.String,
    value: Capability
  }),
  accounts: Schema.Record({
    key: Schema.String,
    value: Account
  }),
  primaryAccounts: Schema.Record({
    key: Schema.String,
    value: Schema.String
  }),
  username: Schema.String,
  apiUrl: Schema.String,
  downloadUrl: Schema.String,
  uploadUrl: Schema.String,
  eventSourceUrl: Schema.String,
  state: Schema.String
})

export type Session = Schema.Schema.Type<typeof Session>

/**
 * Result reference for chaining method calls
 */
export const ResultReference = Schema.Struct({
  resultOf: Schema.String,
  name: Schema.String,
  path: Schema.String
})

export type ResultReference = Schema.Schema.Type<typeof ResultReference>

/**
 * Invocation represents a method call in JMAP
 */
export const Invocation = Schema.Tuple(
  Schema.String,  // method name
  Schema.Any,     // arguments object
  Schema.String   // call id
)

export type Invocation = Schema.Schema.Type<typeof Invocation>

/**
 * JMAP Request envelope
 */
export const Request = Schema.Struct({
  using: Schema.Array(Schema.String),
  methodCalls: Schema.Array(Invocation),
  createdIds: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.String
  }))
})

export type Request = Schema.Schema.Type<typeof Request>

/**
 * Method response tuple
 */
export const MethodResponse = Schema.Tuple(
  Schema.String,  // method name
  Schema.Any,     // response object
  Schema.String   // call id
)

export type MethodResponse = Schema.Schema.Type<typeof MethodResponse>

/**
 * JMAP Response envelope
 */
export const Response = Schema.Struct({
  methodResponses: Schema.Array(MethodResponse),
  createdIds: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.String
  })),
  sessionState: Schema.String
})

export type Response = Schema.Schema.Type<typeof Response>

/**
 * Standard arguments for get methods
 */
export const GetArguments = Schema.Struct({
  accountId: Schema.String,
  ids: Schema.Union(Schema.Array(Schema.String), Schema.Null),
  properties: Schema.optional(Schema.Array(Schema.String))
})

export type GetArguments = Schema.Schema.Type<typeof GetArguments>

/**
 * Standard response for get methods
 */
export const GetResponse = <T>(schema: Schema.Schema<T>) =>
  Schema.Struct({
    accountId: Schema.String,
    state: Schema.String,
    list: Schema.Array(schema),
    notFound: Schema.Array(Schema.String)
  })

/**
 * Standard arguments for set methods
 */
export const SetArguments = <T>(schema: Schema.Schema<T>) =>
  Schema.Struct({
    accountId: Schema.String,
    ifInState: Schema.optional(Schema.String),
    create: Schema.optional(Schema.Record({
      key: Schema.String,
      value: schema
    })),
    update: Schema.optional(Schema.Record({
      key: Schema.String,
      value: Schema.partial(schema)
    })),
    destroy: Schema.optional(Schema.Array(Schema.String))
  })

/**
 * Standard response for set methods
 */
export const SetResponse = <T>(schema: Schema.Schema<T>) =>
  Schema.Struct({
    accountId: Schema.String,
    oldState: Schema.String,
    newState: Schema.String,
    created: Schema.optional(Schema.Record({
      key: Schema.String,
      value: schema
    })),
    updated: Schema.optional(Schema.Record({
      key: Schema.String,
      value: Schema.Union(schema, Schema.Null)
    })),
    destroyed: Schema.optional(Schema.Array(Schema.String)),
    notCreated: Schema.optional(Schema.Record({
      key: Schema.String,
      value: Schema.Any
    })),
    notUpdated: Schema.optional(Schema.Record({
      key: Schema.String,
      value: Schema.Any
    })),
    notDestroyed: Schema.optional(Schema.Record({
      key: Schema.String,
      value: Schema.Any
    }))
  })

/**
 * Standard arguments for query methods
 */
export const QueryArguments = <T>(filterSchema: Schema.Schema<T>) =>
  Schema.Struct({
    accountId: Schema.String,
    filter: Schema.optional(filterSchema),
    sort: Schema.optional(Schema.Array(Schema.Struct({
      property: Schema.String,
      isAscending: Schema.optional(Schema.Boolean)
    }))),
    position: Schema.optional(Schema.Number),
    anchor: Schema.optional(Schema.String),
    anchorOffset: Schema.optional(Schema.Number),
    limit: Schema.optional(Schema.Number),
    calculateTotal: Schema.optional(Schema.Boolean)
  })

/**
 * Standard response for query methods
 */
export const QueryResponse = Schema.Struct({
  accountId: Schema.String,
  queryState: Schema.String,
  canCalculateChanges: Schema.Boolean,
  position: Schema.Number,
  ids: Schema.Array(Schema.String),
  total: Schema.optional(Schema.Number),
  limit: Schema.optional(Schema.Number)
})

export type QueryResponse = Schema.Schema.Type<typeof QueryResponse>