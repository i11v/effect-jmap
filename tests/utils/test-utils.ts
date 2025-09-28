import { Effect, Layer, TestContext } from 'effect'
import { JMAPClientService, JMAPClient } from '../../src/core/JMAPClient.ts'
import { JMAPFixtures, sampleEmails, mockEmailGetResponse, mockEmailSetResponse, mockEmailQueryResponse, mockEmailCopyResponse, mockEmailImportResponse } from '../fixtures/jmap-responses.ts'

/**
 * Test utilities for Effect-based testing
 */
export const TestUtils = {
  /**
   * Run an Effect in a test context with proper error handling
   */
  runEffect: async <A, E>(effect: Effect.Effect<A, E>) => {
    return Effect.runPromise(
      Effect.provide(effect, TestContext.TestContext)
    )
  },

  /**
   * Run an Effect with a specific layer for testing
   */
  runEffectWithLayer: async <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    layer: Layer.Layer<R>
  ) => {
    return Effect.runPromise(
      Effect.provide(effect, layer)
    )
  }
}

/**
 * Mock JMAP Client for testing
 */
const mockJMAPClient: JMAPClient = {
  getSession: Effect.succeed(JMAPFixtures.session as any),
  getSessionState: Effect.succeed('mock-session-state'),
  request: Effect.succeed({} as any),
  batch: (methodCalls) => {
    const [methodName] = methodCalls[0]

    // Mailbox methods
    if (methodName === 'Mailbox/get') {
      return Effect.succeed({
        methodResponses: [
          ['Mailbox/get', {
            accountId: 'account-1',
            state: 'state-1',
            list: JMAPFixtures.mailboxes,
            notFound: []
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'Mailbox/query') {
      return Effect.succeed({
        methodResponses: [
          ['Mailbox/query', {
            accountId: 'account-1',
            queryState: 'query-state-1',
            canCalculateChanges: true,
            position: 0,
            ids: ['mailbox-1'],
            total: 1
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'Mailbox/set') {
      const args = methodCalls[0][1] as any
      return Effect.succeed({
        methodResponses: [
          ['Mailbox/set', {
            accountId: args.accountId,
            oldState: 'state-1',
            newState: 'state-2',
            created: args.create ? Object.fromEntries(
              Object.entries(args.create).map(([tempId, mailbox]) => [
                tempId,
                {
                  ...mailbox,
                  id: `mailbox-${Date.now()}`,
                  parentId: (mailbox as any).parentId || null,
                  role: null,
                  totalEmails: 0,
                  unreadEmails: 0,
                  totalThreads: 0,
                  unreadThreads: 0,
                  myRights: {
                    mayReadItems: true,
                    mayAddItems: true,
                    mayRemoveItems: true,
                    maySetSeen: true,
                    maySetKeywords: true,
                    mayCreateChild: true,
                    mayRename: true,
                    mayDelete: true,
                    maySubmit: true
                  },
                  isSubscribed: true
                }
              ])
            ) : undefined,
            updated: args.update ? Object.fromEntries(
              Object.entries(args.update).map(([id, updates]) => [id, {
                ...JMAPFixtures.mailboxes[0],
                ...updates
              }])
            ) : undefined,
            destroyed: args.destroy || []
          }, methodCalls[0][2]]
        ]
      })
    }

    // Email methods
    if (methodName === 'Email/get') {
      const args = methodCalls[0][1] as any

      // If no IDs specified (null), return all emails
      if (args.ids === null || args.ids === undefined) {
        return Effect.succeed({
          methodResponses: [
            ['Email/get', mockEmailGetResponse, methodCalls[0][2]]
          ]
        })
      }

      // Filter emails based on requested IDs
      // Handle both 'email1' and 'email-1' ID formats for test compatibility
      const requestedIds = args.ids
      const filteredEmails = sampleEmails.filter(email => {
        return requestedIds.includes(email.id) ||
               requestedIds.some((id: string) => {
                 // Handle email1 -> email-1 mapping for tests
                 const normalizedId = id.replace(/^email(\d+)$/, 'email-$1')
                 return normalizedId === email.id
               })
      })

      return Effect.succeed({
        methodResponses: [
          ['Email/get', {
            ...mockEmailGetResponse,
            list: filteredEmails
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'Email/set') {
      const args = methodCalls[0][1] as any
      return Effect.succeed({
        methodResponses: [
          ['Email/set', {
            ...mockEmailSetResponse,
            accountId: args.accountId,
            updated: args.update ? Object.fromEntries(
              Object.keys(args.update).map(id => [id, sampleEmails[0]])
            ) : undefined,
            destroyed: args.destroy || []
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'Email/query') {
      const args = methodCalls[0][1] as any
      return Effect.succeed({
        methodResponses: [
          ['Email/query', {
            ...mockEmailQueryResponse,
            collapseThreads: args.collapseThreads || undefined
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'Email/queryChanges') {
      return Effect.succeed({
        methodResponses: [
          ['Email/queryChanges', {
            accountId: 'test-account',
            oldQueryState: 'query-state-123',
            newQueryState: 'query-state-124',
            removed: [],
            added: [{ id: 'email-1', index: 0 }]
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'Email/copy') {
      return Effect.succeed({
        methodResponses: [
          ['Email/copy', mockEmailCopyResponse, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'Email/import') {
      return Effect.succeed({
        methodResponses: [
          ['Email/import', mockEmailImportResponse, methodCalls[0][2]]
        ]
      })
    }

    // Default fallback
    return Effect.succeed({
      methodResponses: [
        [methodName, {}, methodCalls[0][2]]
      ]
    })
  }
}

/**
 * Test layer with mocked JMAP client
 */
export const testJMAPClient = Layer.succeed(JMAPClientService, mockJMAPClient)