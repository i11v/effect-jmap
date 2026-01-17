import { Effect, Layer, TestContext } from 'effect'
import { JMAPClientService, JMAPClient } from '../../src/core/JMAPClient.ts'
import {
  JMAPFixtures,
  sampleEmails,
  mockEmailGetResponse,
  mockEmailSetResponse,
  mockEmailQueryResponse,
  mockEmailCopyResponse,
  mockEmailImportResponse,
  sampleEmailSubmissions,
  mockEmailSubmissionGetResponse,
  mockEmailSubmissionSetResponse,
  mockEmailSubmissionQueryResponse,
  mockEmailSubmissionQueryChangesResponse,
  mockEmailSubmissionChangesResponse
} from '../fixtures/jmap-responses.ts'

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
      // Per RFC 8620: /set response fields are nullable (Type|null), not optional
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
            ) : null,
            updated: args.update ? Object.fromEntries(
              Object.entries(args.update).map(([id, updates]) => [id, {
                ...JMAPFixtures.mailboxes[0],
                ...updates
              }])
            ) : null,
            destroyed: args.destroy || null,
            notCreated: null,
            notUpdated: null,
            notDestroyed: null
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
      // Per RFC 8620: /set response fields are nullable (Type|null), not optional
      return Effect.succeed({
        methodResponses: [
          ['Email/set', {
            accountId: args.accountId,
            oldState: mockEmailSetResponse.oldState,
            newState: mockEmailSetResponse.newState,
            created: null,
            updated: args.update ? Object.fromEntries(
              Object.keys(args.update).map(id => [id, sampleEmails[0]])
            ) : null,
            destroyed: args.destroy || null,
            notCreated: null,
            notUpdated: null,
            notDestroyed: null
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

    // EmailSubmission methods
    if (methodName === 'EmailSubmission/get') {
      const args = methodCalls[0][1] as any

      // If no IDs specified (null), return all submissions
      if (args.ids === null || args.ids === undefined) {
        return Effect.succeed({
          methodResponses: [
            ['EmailSubmission/get', mockEmailSubmissionGetResponse, methodCalls[0][2]]
          ]
        })
      }

      // Filter submissions based on requested IDs
      const requestedIds = args.ids
      const filteredSubmissions = sampleEmailSubmissions.filter(submission =>
        requestedIds.includes(submission.id)
      )

      return Effect.succeed({
        methodResponses: [
          ['EmailSubmission/get', {
            ...mockEmailSubmissionGetResponse,
            list: filteredSubmissions
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'EmailSubmission/set') {
      const args = methodCalls[0][1] as any
      const createdSubmissions: Record<string, any> = {}

      // Handle create - return minimal result matching Fastmail behavior
      if (args.create) {
        Object.entries(args.create).forEach(([tempId, submission]: [string, any]) => {
          createdSubmissions[tempId] = {
            id: `submission-${Date.now()}`,
            sendAt: submission.sendAt || new Date().toISOString(),
            undoStatus: 'final'
          }
        })
      }

      // Per RFC 8620: /set response fields are nullable (Type|null), not optional
      return Effect.succeed({
        methodResponses: [
          ['EmailSubmission/set', {
            accountId: args.accountId,
            oldState: mockEmailSubmissionSetResponse.oldState,
            newState: mockEmailSubmissionSetResponse.newState,
            created: Object.keys(createdSubmissions).length > 0 ? createdSubmissions : null,
            updated: args.update ? Object.fromEntries(
              Object.keys(args.update).map(id => [id, {
                id,
                sendAt: new Date().toISOString(),
                undoStatus: 'final'
              }])
            ) : null,
            destroyed: args.destroy || null,
            notCreated: null,
            notUpdated: null,
            notDestroyed: null
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'EmailSubmission/query') {
      const args = methodCalls[0][1] as any
      return Effect.succeed({
        methodResponses: [
          ['EmailSubmission/query', {
            ...mockEmailSubmissionQueryResponse,
            accountId: args.accountId
          }, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'EmailSubmission/queryChanges') {
      return Effect.succeed({
        methodResponses: [
          ['EmailSubmission/queryChanges', mockEmailSubmissionQueryChangesResponse, methodCalls[0][2]]
        ]
      })
    }

    if (methodName === 'EmailSubmission/changes') {
      return Effect.succeed({
        methodResponses: [
          ['EmailSubmission/changes', mockEmailSubmissionChangesResponse, methodCalls[0][2]]
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