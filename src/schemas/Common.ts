import { Schema } from 'effect'

/**
 * Common JMAP schemas used across different object types
 */

/**
 * JMAP Id - a string identifier
 */
export const Id = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(255),
  Schema.brand('Id')
)

export type Id = Schema.Schema.Type<typeof Id>

/**
 * JMAP UnsignedInt - non-negative integer
 */
export const UnsignedInt = Schema.Number.pipe(
  Schema.int(),
  Schema.nonNegative(),
  Schema.brand('UnsignedInt')
)

export type UnsignedInt = Schema.Schema.Type<typeof UnsignedInt>

/**
 * JMAP Date - ISO 8601 date string (UTC or with timezone offset)
 */
export const JMAPDate = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/),
  Schema.brand('JMAPDate')
)

export type JMAPDate = Schema.Schema.Type<typeof JMAPDate>

/**
 * Transform a JavaScript Date to JMAP date string
 */
export const dateToJMAPDate = (date: Date): JMAPDate =>
  date.toISOString() as JMAPDate

/**
 * Transform a JMAP date string to JavaScript Date
 */
export const jmapDateToDate = (jmapDate: JMAPDate): Date =>
  new Date(jmapDate)

/**
 * JMAP PatchObject for partial updates
 * Represents a JSON Patch-like object for updating properties
 */
export const PatchObject = () =>
  Schema.Record({
    key: Schema.String,
    value: Schema.Any
  })

/**
 * JMAP Blob reference
 */
export const Blob = Schema.Struct({
  blobId: Schema.String,
  type: Schema.String,
  size: UnsignedInt
})

export type Blob = Schema.Schema.Type<typeof Blob>

/**
 * JMAP AddressList - represents email addresses
 */
export const EmailAddress = Schema.Struct({
  name: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  )
})

export type EmailAddress = Schema.Schema.Type<typeof EmailAddress>

/**
 * JMAP Keywords - set of keywords/flags
 */
export const Keywords = Schema.Record({
  key: Schema.String,
  value: Schema.Boolean
})

export type Keywords = Schema.Schema.Type<typeof Keywords>

/**
 * Standard JMAP keywords
 */
export const StandardKeywords = {
  SEEN: '$seen',
  FLAGGED: '$flagged',
  ANSWERED: '$answered',
  FORWARDED: '$forwarded',
  DRAFT: '$draft'
} as const

/**
 * JMAP State - represents state of objects for synchronization
 */
export const State = Schema.String.pipe(
  Schema.brand('State')
)

export type State = Schema.Schema.Type<typeof State>

/**
 * JMAP QueryState - represents state of a query for change tracking
 */
export const QueryState = Schema.String.pipe(
  Schema.brand('QueryState')
)

export type QueryState = Schema.Schema.Type<typeof QueryState>

/**
 * JMAP Position - represents position in a list
 */
export const Position = UnsignedInt

export type Position = UnsignedInt

/**
 * JMAP Comparator for sorting
 */
export const Comparator = Schema.Struct({
  property: Schema.String,
  isAscending: Schema.optional(Schema.Boolean),
  collation: Schema.optional(Schema.String)
})

export type Comparator = Schema.Schema.Type<typeof Comparator>

/**
 * JMAP FilterCondition - base interface for filters
 */
export const FilterCondition = Schema.Struct({
  operator: Schema.optional(Schema.Literal('AND', 'OR', 'NOT'))
})

/**
 * JMAP UpdateMap - for tracking which properties to update
 */
export const UpdateMap = <T>(schema: Schema.Schema<T>) =>
  Schema.Record({
    key: Schema.String,
    value: Schema.partial(schema)
  })

/**
 * JMAP Rights - permissions for an object
 */
export const Rights = Schema.Struct({
  mayRead: Schema.Boolean,
  mayWrite: Schema.Boolean,
  mayDelete: Schema.Boolean
})

export type Rights = Schema.Schema.Type<typeof Rights>

/**
 * Helper functions for common operations
 */
export const Common = {
  /**
   * Create a new JMAP Id
   */
  createId: (value: string): Id => Schema.decodeSync(Id)(value),

  /**
   * Create an UnsignedInt
   */
  createUnsignedInt: (value: number): UnsignedInt =>
    Schema.decodeSync(UnsignedInt)(value),

  /**
   * Create a JMAP Date from current time
   */
  now: (): JMAPDate => dateToJMAPDate(new Date()),

  /**
   * Create a State
   */
  createState: (value: string): State => Schema.decodeSync(State)(value),

  /**
   * Create a QueryState
   */
  createQueryState: (value: string): QueryState =>
    Schema.decodeSync(QueryState)(value)
}