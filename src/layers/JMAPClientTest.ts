import { Context, Effect, Layer } from 'effect'
import type { JMAPClient } from '../core/JMAPClient.js'
import type { Session, Request, Response, Invocation } from '../core/Types.js'
import { Errors } from '../core/Errors.js'
import * as Schema from 'effect/Schema'

/**
 * Test client configuration with mock data
 */
export interface JMAPTestConfig {
  readonly mockSession: Session
  readonly mockResponses?: Map<string, unknown>
  readonly simulateErrors?: boolean
  readonly simulateNetworkDelay?: number | undefined
}

/**
 * Test implementation of JMAP Client for unit testing
 */
const makeJMAPClientTest = (config: JMAPTestConfig): JMAPClient => {
  let sessionState = config.mockSession

  const simulateDelay = config.simulateNetworkDelay
    ? Effect.sleep(config.simulateNetworkDelay)
    : Effect.void

  const getSession: JMAPClient['getSession'] = Effect.gen(function* () {
    yield* simulateDelay

    if (config.simulateErrors) {
      yield* Effect.fail(Errors.network('Simulated network error'))
    }

    return sessionState
  })

  const request: JMAPClient['request'] = <T>(
    request: Request,
    responseSchema: Schema.Schema<T>
  ) => Effect.gen(function* () {
    yield* simulateDelay

    if (config.simulateErrors) {
      yield* Effect.fail(Errors.authentication('Simulated auth error'))
    }

    // Create a mock response based on the request
    const mockResponse: Response = {
      methodResponses: request.methodCalls.map(([methodName, args, callId]) => {
        // Check if we have a specific mock response for this method
        const mockKey = `${methodName}_${JSON.stringify(args)}`
        const specificMock = config.mockResponses?.get(mockKey)

        if (specificMock) {
          return [methodName, specificMock, callId]
        }

        // Default mock responses based on method type
        switch (methodName) {
          case 'Mailbox/get':
            return [methodName, {
              accountId: args.accountId,
              state: 'mock-state-123',
              list: [],
              notFound: []
            }, callId]

          case 'Email/get':
            return [methodName, {
              accountId: args.accountId,
              state: 'mock-state-456',
              list: [],
              notFound: []
            }, callId]

          case 'Email/query':
            return [methodName, {
              accountId: args.accountId,
              queryState: 'mock-query-state-789',
              canCalculateChanges: true,
              position: 0,
              ids: [],
              total: 0
            }, callId]

          default:
            return [methodName, {
              accountId: args.accountId || 'mock-account'
            }, callId]
        }
      }),
      sessionState: sessionState.state
    }

    return yield* Schema.decodeUnknown(responseSchema)(mockResponse).pipe(
      Effect.catchAll(error =>
        Effect.fail(Errors.network('Mock response validation failed', error))
      )
    )
  })

  const batch: JMAPClient['batch'] = (
    methodCalls: ReadonlyArray<Invocation>,
    _using: ReadonlyArray<string> = ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail']
  ) => Effect.gen(function* () {
    yield* simulateDelay

    if (config.simulateErrors) {
      yield* Effect.fail(Errors.network('Simulated batch error'))
    }

    // Create mock batch response
    const mockResponse: Response = {
      methodResponses: methodCalls.map(([methodName, args, callId]) => {
        return [methodName, {
          accountId: args?.accountId || 'mock-account'
        }, callId]
      }),
      sessionState: sessionState.state
    }

    return mockResponse
  })

  const getSessionState: JMAPClient['getSessionState'] = Effect.gen(function* () {
    yield* simulateDelay
    return sessionState.state
  })

  return {
    getSession,
    request,
    batch,
    getSessionState
  }
}

/**
 * Test layer for JMAP Client
 */
export const JMAPClientTest = (config: JMAPTestConfig): Layer.Layer<JMAPClient> =>
  Layer.succeed(Context.GenericTag<JMAPClient>('JMAPClient'), makeJMAPClientTest(config))

/**
 * Default test configuration with minimal mock data
 */
export const defaultTestConfig = (): JMAPTestConfig => ({
  mockSession: {
    capabilities: {
      'urn:ietf:params:jmap:core': {
        maxSizeUpload: 50000000,
        maxConcurrentUpload: 4,
        maxSizeRequest: 10000000,
        maxConcurrentRequests: 4,
        maxCallsInRequest: 16,
        maxObjectsInGet: 500,
        maxObjectsInSet: 500,
        collationAlgorithms: ['i;ascii-numeric', 'i;ascii-casemap']
      },
      'urn:ietf:params:jmap:mail': {}
    },
    accounts: {
      'test-account-id': {
        name: 'Test Account',
        isPersonal: true,
        isReadOnly: false,
        accountCapabilities: {
          'urn:ietf:params:jmap:mail': {}
        }
      }
    },
    primaryAccounts: {
      'urn:ietf:params:jmap:mail': 'test-account-id'
    },
    username: 'test@example.com',
    apiUrl: 'https://test.example.com/jmap/',
    downloadUrl: 'https://test.example.com/download/{accountId}/{blobId}/{name}?accept={type}',
    uploadUrl: 'https://test.example.com/upload/{accountId}/',
    eventSourceUrl: 'https://test.example.com/eventSource?types={types}&closeAfter={closeAfter}&ping={ping}',
    state: 'test-session-state-123'
  },
  simulateErrors: false,
  simulateNetworkDelay: undefined
})

/**
 * Helper to create test config with custom mock responses
 */
export const withMockResponses = (
  mockResponses: Array<[string, unknown]>
): JMAPTestConfig => ({
  ...defaultTestConfig(),
  mockResponses: new Map(mockResponses)
})

/**
 * Helper to create test config that simulates errors
 */
export const withErrors = (): JMAPTestConfig => ({
  ...defaultTestConfig(),
  simulateErrors: true
})

/**
 * Helper to create test config with network delay simulation
 */
export const withDelay = (delayMs: number): JMAPTestConfig => ({
  ...defaultTestConfig(),
  simulateNetworkDelay: delayMs
})