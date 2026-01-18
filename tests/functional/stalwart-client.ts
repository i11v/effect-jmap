/**
 * Stalwart JMAP Client for Functional Testing
 *
 * This module provides a JMAP client layer configured for Stalwart server
 * testing with Basic authentication support.
 */

import { Context, Effect, Layer, Schedule, Duration } from "effect"
import { HttpClient, HttpClientRequest, HttpBody } from "@effect/platform"
import * as Schema from "effect/Schema"
import {
  JMAPClientService,
  type JMAPClientConfig,
} from "../../src/client/client.ts"
import {
  Session,
  Request,
  Response,
  type Invocation,
} from "../../src/client/types.ts"
import {
  SessionError,
  NetworkError,
  AuthenticationError,
  JMAPMethodError,
  type MethodError,
  Errors,
} from "../../src/client/errors.ts"

/**
 * Stalwart test configuration
 */
export interface StalwartTestConfig {
  readonly baseUrl: string
  readonly username: string
  readonly password: string
  readonly timeout?: number
  readonly maxRetries?: number
  readonly retryDelay?: number
  readonly maxBatchSize?: number
  readonly enableRequestLogging?: boolean
}

/**
 * Default Stalwart test configuration
 */
export const defaultStalwartConfig: StalwartTestConfig = {
  baseUrl: "http://localhost:8080",
  username: "testuser",
  password: "testpassword123",
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  maxBatchSize: 50,
  enableRequestLogging: false,
}

/**
 * Test users for Stalwart
 */
export const TestUsers = {
  testuser: {
    username: "testuser",
    password: "testpassword123",
    email: "testuser@test.local",
  },
  alice: {
    username: "alice",
    password: "alicepassword123",
    email: "alice@test.local",
  },
  bob: {
    username: "bob",
    password: "bobpassword123",
    email: "bob@test.local",
  },
  admin: {
    username: "admin",
    password: "test-admin-password",
    email: "admin@test.local",
  },
} as const

/**
 * Helper to create Basic auth header
 */
const basicAuth = (username: string, password: string): string => {
  const credentials = Buffer.from(`${username}:${password}`).toString("base64")
  return `Basic ${credentials}`
}

/**
 * Internal session state management
 */
interface SessionState {
  readonly session: Session
  readonly lastUpdated: Date
}

/**
 * Create a Stalwart JMAP client with Basic auth
 */
const makeStalwartClient = (
  config: StalwartTestConfig
): Context.Tag.Service<typeof JMAPClientService> => {
  let sessionState: SessionState | null = null

  // Use /jmap/session directly since /.well-known/jmap returns a 307 redirect
  const sessionUrl = `${config.baseUrl}/jmap/session`

  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: basicAuth(config.username, config.password),
    "User-Agent": "effect-jmap-test/0.1.0",
  }

  const retrySchedule = Schedule.exponential(
    Duration.millis(config.retryDelay ?? 1000)
  ).pipe(Schedule.intersect(Schedule.recurs(config.maxRetries ?? 3)))

  const logRequest = (message: string, data?: unknown) =>
    config.enableRequestLogging ? Effect.log(message, data) : Effect.void

  const fetchSession = Effect.gen(function* () {
    yield* logRequest("Fetching JMAP session", { url: sessionUrl })

    const httpClient = yield* HttpClient.HttpClient

    const request = HttpClientRequest.get(sessionUrl).pipe(
      HttpClientRequest.setHeaders(defaultHeaders)
    )

    const response = yield* httpClient.execute(request).pipe(
      Effect.retry(retrySchedule),
      Effect.catchAll((error) =>
        Effect.fail(Errors.network("Failed to connect to JMAP server", error))
      )
    )

    if (response.status === 401) {
      yield* Effect.fail(Errors.authentication("Invalid credentials"))
    }

    if (response.status !== 200) {
      yield* Effect.fail(
        Errors.network(`HTTP ${response.status}`, undefined, response.status)
      )
    }

    const jsonText = yield* response.text.pipe(
      Effect.catchAll(() =>
        Effect.fail(Errors.network("Failed to read response body"))
      )
    )

    let jsonData: unknown
    try {
      jsonData = JSON.parse(jsonText)
    } catch (error) {
      yield* Effect.fail(
        Errors.network(
          "Invalid JSON response",
          error instanceof Error ? error : undefined
        )
      )
    }

    const session = yield* Schema.decodeUnknown(Session)(jsonData).pipe(
      Effect.catchAll((error) =>
        Effect.fail(Errors.session("Invalid session response format", error))
      )
    )

    // Fix apiUrl if it contains Docker container hostname
    // Replace with our configured baseUrl
    const baseUrlParsed = new URL(config.baseUrl)
    const apiUrlParsed = new URL(session.apiUrl)
    apiUrlParsed.host = baseUrlParsed.host
    apiUrlParsed.protocol = baseUrlParsed.protocol
    const fixedSession = {
      ...session,
      apiUrl: apiUrlParsed.toString()
    }

    sessionState = {
      session: fixedSession,
      lastUpdated: new Date(),
    }

    return fixedSession
  })

  const getSession = Effect.gen(function* () {
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

  const executeJMAPRequest = (request: Request) =>
    Effect.gen(function* () {
      const session = yield* getSession
      const httpClient = yield* HttpClient.HttpClient

      const requestBody = JSON.stringify(request)
      yield* logRequest("Sending JMAP request", {
        apiUrl: session.apiUrl,
        methodCalls: request.methodCalls.length,
        requestSize: requestBody.length,
      })

      const httpRequest = HttpClientRequest.post(session.apiUrl).pipe(
        HttpClientRequest.setHeaders(defaultHeaders),
        HttpClientRequest.setBody(
          HttpBody.text(requestBody, "application/json")
        )
      )

      const response = yield* httpClient.execute(httpRequest).pipe(
        Effect.retry(retrySchedule),
        Effect.catchAll((error) =>
          Effect.fail(Errors.network("Failed to send JMAP request", error))
        )
      )

      if (response.status === 401) {
        sessionState = null
        yield* Effect.fail(Errors.authentication("Credentials expired or invalid"))
      }

      if (response.status !== 200) {
        yield* Effect.fail(
          Errors.network(`HTTP ${response.status}`, undefined, response.status)
        )
      }

      const jsonText = yield* response.text.pipe(
        Effect.catchAll(() =>
          Effect.fail(Errors.network("Failed to read response body"))
        )
      )

      let jsonData: unknown
      try {
        jsonData = JSON.parse(jsonText)
      } catch (error) {
        yield* Effect.fail(
          Errors.network(
            "Invalid JSON response",
            error instanceof Error ? error : undefined
          )
        )
      }

      const jmapResponse = yield* Schema.decodeUnknown(Response)(jsonData).pipe(
        Effect.catchAll((error) =>
          Effect.fail(Errors.network("Invalid JMAP response format", error))
        )
      )

      yield* logRequest("Received JMAP response", {
        methodResponses: jmapResponse.methodResponses.length,
        sessionState: jmapResponse.sessionState,
      })

      // Check for method errors in response
      for (const [methodName, result, callId] of jmapResponse.methodResponses) {
        if (methodName === "error") {
          const methodError = result as MethodError
          yield* Effect.fail(JMAPMethodError.fromMethodError(methodError, callId))
        }
      }

      return jmapResponse
    })

  const request = <T>(request: Request, responseSchema: Schema.Schema<T>) =>
    Effect.gen(function* () {
      const jmapResponse = yield* executeJMAPRequest(request)

      return yield* Schema.decodeUnknown(responseSchema)(jmapResponse).pipe(
        Effect.catchAll((error) =>
          Effect.fail(
            Errors.network("Response does not match expected schema", error)
          )
        )
      )
    })

  const batch = (
    methodCalls: ReadonlyArray<Invocation>,
    using: ReadonlyArray<string> = [
      "urn:ietf:params:jmap:core",
      "urn:ietf:params:jmap:mail",
    ]
  ) =>
    Effect.gen(function* () {
      const maxBatchSize = config.maxBatchSize ?? 50

      if (methodCalls.length > maxBatchSize) {
        const chunks: Invocation[][] = []
        for (let i = 0; i < methodCalls.length; i += maxBatchSize) {
          chunks.push(Array.from(methodCalls.slice(i, i + maxBatchSize)))
        }

        const allResponses: Response["methodResponses"] = []
        let latestSessionState = ""

        for (const chunk of chunks) {
          const chunkRequest: Request = {
            using,
            methodCalls: chunk,
          }
          const chunkResponse = yield* executeJMAPRequest(chunkRequest)
          allResponses.push(...chunkResponse.methodResponses)
          latestSessionState = chunkResponse.sessionState
        }

        return {
          methodResponses: allResponses,
          sessionState: latestSessionState,
        } as Response
      }

      const req: Request = {
        using,
        methodCalls,
      }

      return yield* executeJMAPRequest(req)
    })

  const getSessionState = Effect.gen(function* () {
    const session = yield* getSession
    return session.state
  })

  return {
    getSession,
    request,
    batch,
    getSessionState,
  }
}

/**
 * Create a Stalwart client layer for testing
 */
export const StalwartClientLive = (
  config: StalwartTestConfig = defaultStalwartConfig
): Layer.Layer<JMAPClientService, never, HttpClient.HttpClient> =>
  Layer.succeed(JMAPClientService, makeStalwartClient(config))

/**
 * Create a Stalwart client layer for a specific test user
 */
export const StalwartClientForUser = (
  user: keyof typeof TestUsers,
  baseUrl: string = "http://localhost:8080"
): Layer.Layer<JMAPClientService, never, HttpClient.HttpClient> => {
  const testUser = TestUsers[user]
  return StalwartClientLive({
    ...defaultStalwartConfig,
    baseUrl,
    username: testUser.username,
    password: testUser.password,
  })
}

/**
 * Helper to check if the Stalwart server is available
 */
export const isStalwartAvailable = (
  baseUrl: string = "http://localhost:8080"
) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient

    const request = HttpClientRequest.get(`${baseUrl}/.well-known/jmap`)
    const response = yield* httpClient.execute(request).pipe(
      Effect.timeout(Duration.seconds(5)),
      Effect.catchAll(() => Effect.succeed(null))
    )

    // Accept 200 or 307 (redirect to /jmap/session) as available
    return response !== null && (response.status === 200 || response.status === 307)
  })

/**
 * Skip test if Stalwart is not available
 */
export const skipIfStalwartUnavailable = (
  baseUrl: string = "http://localhost:8080"
) =>
  Effect.gen(function* () {
    const available = yield* isStalwartAvailable(baseUrl)
    if (!available) {
      yield* Effect.fail(
        new Error(
          "Stalwart server not available. Run 'pnpm test:server:start' first."
        )
      )
    }
  })
