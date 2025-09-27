import { Data, Schema } from 'effect'

/**
 * JMAP Error Types - RFC 8621
 */

/**
 * Base JMAP error class
 */
export class JMAPError extends Data.TaggedError('JMAPError')<{
  readonly message: string
  readonly details?: unknown
}> {}

/**
 * Network-related errors
 */
export class NetworkError extends Data.TaggedError('NetworkError')<{
  readonly message: string
  readonly cause?: Error
  readonly status?: number
}> {}

/**
 * Authentication errors
 */
export class AuthenticationError extends Data.TaggedError('AuthenticationError')<{
  readonly message: string
  readonly details?: unknown
}> {}

/**
 * Session-related errors
 */
export class SessionError extends Data.TaggedError('SessionError')<{
  readonly message: string
  readonly details?: unknown
}> {}

/**
 * JMAP method error types as defined in RFC 8621
 */
export const MethodErrorType = Schema.Literal(
  'accountNotFound',
  'accountNotSupportedByMethod',
  'accountReadOnly',
  'anchorNotFound',
  'cannotCalculateChanges',
  'forbidden',
  'fromAccountNotFound',
  'fromAccountNotSupportedByMethod',
  'invalidArguments',
  'invalidPatch',
  'invalidProperties',
  'notFound',
  'notJSON',
  'notRequest',
  'overQuota',
  'rateLimit',
  'requestTooLarge',
  'serverFail',
  'serverPartialFail',
  'serverUnavailable',
  'singleton',
  'tooLarge',
  'tooManyChanges',
  'unknownCapability',
  'unknownMethod',
  'unsupportedFilter',
  'unsupportedSort',
  'willDestroy'
)

export type MethodErrorType = Schema.Schema.Type<typeof MethodErrorType>

/**
 * JMAP method error schema
 */
export const MethodError = Schema.Struct({
  type: MethodErrorType,
  description: Schema.optional(Schema.String),
  details: Schema.optional(Schema.Any)
})

export type MethodError = Schema.Schema.Type<typeof MethodError>

/**
 * Method error class for Effect error handling
 */
export class JMAPMethodError extends Data.TaggedError('JMAPMethodError')<{
  readonly type: MethodErrorType
  readonly description?: string
  readonly details?: unknown
  readonly callId?: string
}> {
  static fromMethodError(error: MethodError, callId?: string): JMAPMethodError {
    const params: { type: MethodErrorType; description?: string; details?: unknown; callId?: string } = {
      type: error.type
    }
    if (error.description !== undefined) params.description = error.description
    if (error.details !== undefined) params.details = error.details
    if (callId !== undefined) params.callId = callId
    return new JMAPMethodError(params)
  }

  get message(): string {
    return this.description ?? `JMAP Method Error: ${this.type}`
  }
}

/**
 * Validation error for schema validation failures
 */
export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string
  readonly errors: Array<{
    path: ReadonlyArray<string | number>
    message: string
  }>
}> {}

/**
 * Configuration error for client setup issues
 */
export class ConfigurationError extends Data.TaggedError('ConfigurationError')<{
  readonly message: string
  readonly field?: string
}> {}

/**
 * Union of all possible JMAP errors
 */
export type AllJMAPErrors =
  | JMAPError
  | NetworkError
  | AuthenticationError
  | SessionError
  | JMAPMethodError
  | ValidationError
  | ConfigurationError

/**
 * Helper functions for creating common errors
 */
export const Errors = {
  network: (message: string, cause?: Error, status?: number): NetworkError => {
    const params: { message: string; cause?: Error; status?: number } = { message }
    if (cause !== undefined) params.cause = cause
    if (status !== undefined) params.status = status
    return new NetworkError(params)
  },

  authentication: (message: string, details?: unknown): AuthenticationError => {
    const params: { message: string; details?: unknown } = { message }
    if (details !== undefined) params.details = details
    return new AuthenticationError(params)
  },

  session: (message: string, details?: unknown): SessionError => {
    const params: { message: string; details?: unknown } = { message }
    if (details !== undefined) params.details = details
    return new SessionError(params)
  },

  validation: (
    message: string,
    errors: Array<{ path: ReadonlyArray<string | number>; message: string }>
  ): ValidationError =>
    new ValidationError({ message, errors }),

  configuration: (message: string, field?: string): ConfigurationError => {
    const params: { message: string; field?: string } = { message }
    if (field !== undefined) params.field = field
    return new ConfigurationError(params)
  },

  methodError: (
    type: MethodErrorType,
    description?: string,
    details?: unknown,
    callId?: string
  ): JMAPMethodError => {
    const params: { type: MethodErrorType; description?: string; details?: unknown; callId?: string } = { type }
    if (description !== undefined) params.description = description
    if (details !== undefined) params.details = details
    if (callId !== undefined) params.callId = callId
    return new JMAPMethodError(params)
  }
}