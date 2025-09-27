import { Context, Effect, Layer, Schedule, Duration } from 'effect'
import { HttpClient, HttpClientRequest, HttpBody } from '@effect/platform'
import { Session, Request, Response, Invocation } from './Types.js'
import { SessionError, NetworkError, AuthenticationError, JMAPMethodError, Errors } from './Errors.js'
import * as Schema from 'effect/Schema'

/**
 * JMAP Client Configuration
 */
export interface JMAPClientConfig {
  readonly sessionUrl: string
  readonly bearerToken: string
  readonly userAgent?: string
  readonly timeout?: number
  readonly maxRetries?: number
  readonly retryDelay?: number
  readonly maxBatchSize?: number
  readonly enableRequestLogging?: boolean
}

/**
 * JMAP Client Service Interface
 */
export interface JMAPClient {
  /**
   * Get the current session information
   */
  readonly getSession: Effect.Effect<Session, SessionError | NetworkError | AuthenticationError, HttpClient.HttpClient>

  /**
   * Send a JMAP request
   */
  readonly request: <T>(
    request: Request,
    responseSchema: Schema.Schema<T>
  ) => Effect.Effect<T, JMAPMethodError | NetworkError | AuthenticationError | SessionError, HttpClient.HttpClient>

  /**
   * Send a batch of method calls in a single request
   */
  readonly batch: (
    methodCalls: ReadonlyArray<Invocation>,
    using?: ReadonlyArray<string>
  ) => Effect.Effect<Response, JMAPMethodError | NetworkError | AuthenticationError | SessionError, HttpClient.HttpClient>

  /**
   * Get the current session state for synchronization
   */
  readonly getSessionState: Effect.Effect<string, SessionError | NetworkError | AuthenticationError, HttpClient.HttpClient>
}

/**
 * JMAP Client Service Tag
 */
export const JMAPClient = Context.GenericTag<JMAPClient>('JMAPClient')

/**
 * Internal session state management
 */
interface SessionState {
  readonly session: Session
  readonly lastUpdated: Date
}

/**
 * Live implementation of JMAP Client
 */
const makeJMAPClientLive = (config: JMAPClientConfig): JMAPClient => {
  let sessionState: SessionState | null = null

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.bearerToken}`,
    'User-Agent': config.userAgent ?? 'effect-jmap/0.1.0'
  }

  const retrySchedule = Schedule.exponential(Duration.millis(config.retryDelay ?? 1000)).pipe(
    Schedule.intersect(Schedule.recurs(config.maxRetries ?? 3))
  )

  const logRequest = (message: string, data?: unknown) =>
    config.enableRequestLogging
      ? Effect.log(message, data)
      : Effect.void

  const fetchSession = Effect.gen(function* () {
    yield* logRequest('Fetching JMAP session', { url: config.sessionUrl })

    const httpClient = yield* HttpClient.HttpClient

    const request = HttpClientRequest.get(config.sessionUrl).pipe(
      HttpClientRequest.setHeaders(defaultHeaders),
      config.timeout ? HttpClientRequest.setUrlParam('timeout', config.timeout.toString()) : (req) => req
    )

    const response = yield* httpClient.execute(request).pipe(
      Effect.retry(retrySchedule),
      Effect.catchAll(error =>
        Effect.fail(Errors.network('Failed to connect to JMAP server', error))
      )
    )

    if (response.status === 401) {
      yield* Effect.fail(Errors.authentication('Invalid bearer token'))
    }

    if (response.status !== 200) {
      yield* Effect.fail(Errors.network(`HTTP ${response.status}`, undefined, response.status))
    }

    const jsonText = yield* response.text.pipe(
      Effect.catchAll(() =>
        Effect.fail(Errors.network('Failed to read response body'))
      )
    )

    let jsonData: unknown
    try {
      jsonData = JSON.parse(jsonText)
    } catch (error) {
      yield* Effect.fail(Errors.network('Invalid JSON response', error instanceof Error ? error : undefined))
    }

    const session = yield* Schema.decodeUnknown(Session)(jsonData).pipe(
      Effect.catchAll(error =>
        Effect.fail(Errors.session('Invalid session response format', error))
      )
    )

    sessionState = {
      session,
      lastUpdated: new Date()
    }

    return session
  })

  const getSession: JMAPClient['getSession'] = Effect.gen(function* () {
    if (sessionState === null) {
      return yield* fetchSession
    }

    // Refresh session if older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (sessionState.lastUpdated < fiveMinutesAgo) {
      return yield* fetchSession
    }

    return sessionState.session
  })

  const executeJMAPRequest = (request: Request) => Effect.gen(function* () {
    const session = yield* getSession
    const httpClient = yield* HttpClient.HttpClient

    const requestBody = JSON.stringify(request)
    yield* logRequest('Sending JMAP request', {
      apiUrl: session.apiUrl,
      methodCalls: request.methodCalls.length,
      requestSize: requestBody.length
    })

    const httpRequest = HttpClientRequest.post(session.apiUrl).pipe(
      HttpClientRequest.setHeaders(defaultHeaders),
      HttpClientRequest.setBody(HttpBody.text(requestBody)),
      config.timeout ? HttpClientRequest.setUrlParam('timeout', config.timeout.toString()) : (req) => req
    )

    const response = yield* httpClient.execute(httpRequest).pipe(
      Effect.retry(retrySchedule),
      Effect.catchAll(error =>
        Effect.fail(Errors.network('Failed to send JMAP request', error))
      )
    )

    if (response.status === 401) {
      // Clear cached session on auth error
      sessionState = null
      yield* Effect.fail(Errors.authentication('Bearer token expired or invalid'))
    }

    if (response.status !== 200) {
      yield* Effect.fail(Errors.network(`HTTP ${response.status}`, undefined, response.status))
    }

    const jsonText = yield* response.text.pipe(
      Effect.catchAll(() =>
        Effect.fail(Errors.network('Failed to read response body'))
      )
    )

    let jsonData: unknown
    try {
      jsonData = JSON.parse(jsonText)
    } catch (error) {
      yield* Effect.fail(Errors.network('Invalid JSON response', error instanceof Error ? error : undefined))
    }

    const jmapResponse = yield* Schema.decodeUnknown(Response)(jsonData).pipe(
      Effect.catchAll(error =>
        Effect.fail(Errors.network('Invalid JMAP response format', error))
      )
    )

    yield* logRequest('Received JMAP response', {
      methodResponses: jmapResponse.methodResponses.length,
      sessionState: jmapResponse.sessionState
    })

    // Check for method errors in response
    for (const [methodName, result, callId] of jmapResponse.methodResponses) {
      if (methodName === 'error') {
        const methodError = result as any // Should be MethodError but we'll validate it
        yield* Effect.fail(JMAPMethodError.fromMethodError(methodError, callId))
      }
    }

    return jmapResponse
  })

  const request: JMAPClient['request'] = <T>(
    request: Request,
    responseSchema: Schema.Schema<T>
  ) => Effect.gen(function* () {
    const jmapResponse = yield* executeJMAPRequest(request)

    // For now, return the full response - in a real implementation,
    // we'd extract the specific result based on the expected schema
    return yield* Schema.decodeUnknown(responseSchema)(jmapResponse).pipe(
      Effect.catchAll(error =>
        Effect.fail(Errors.network('Response does not match expected schema', error))
      )
    )
  })

  const batch: JMAPClient['batch'] = (
    methodCalls: ReadonlyArray<Invocation>,
    using: ReadonlyArray<string> = ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail']
  ) => Effect.gen(function* () {
    const maxBatchSize = config.maxBatchSize ?? 50

    // Split large batches into smaller chunks
    if (methodCalls.length > maxBatchSize) {
      const chunks: Invocation[][] = []
      for (let i = 0; i < methodCalls.length; i += maxBatchSize) {
        chunks.push(Array.from(methodCalls.slice(i, i + maxBatchSize)))
      }

      // Execute chunks sequentially and combine results
      const allResponses = []
      let latestSessionState = ''

      for (const chunk of chunks) {
        const chunkRequest: Request = {
          using,
          methodCalls: chunk
        }
        const chunkResponse = yield* executeJMAPRequest(chunkRequest)
        allResponses.push(...chunkResponse.methodResponses)
        latestSessionState = chunkResponse.sessionState
      }

      const combinedResponse: Response = {
        methodResponses: allResponses,
        sessionState: latestSessionState
      }

      return combinedResponse
    }

    // Single batch request
    const request: Request = {
      using,
      methodCalls
    }

    return yield* executeJMAPRequest(request)
  })

  const getSessionState: JMAPClient['getSessionState'] = Effect.gen(function* () {
    const session = yield* getSession
    return session.state
  })

  return {
    getSession,
    request,
    batch,
    getSessionState
  }
}

/**
 * Live layer for JMAP Client
 */
export const JMAPClientLive = (config: JMAPClientConfig): Layer.Layer<JMAPClient, never, HttpClient.HttpClient> =>
  Layer.succeed(JMAPClient, makeJMAPClientLive(config))

/**
 * Default configuration creator
 */
export const defaultConfig = (sessionUrl: string, bearerToken: string): JMAPClientConfig => ({
  sessionUrl,
  bearerToken,
  userAgent: 'effect-jmap/0.1.0',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  maxBatchSize: 50,
  enableRequestLogging: false
})