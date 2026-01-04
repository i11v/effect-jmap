import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform'
import {
  EmailSubmissionService,
  EmailSubmissionServiceLive,
  EmailSubmissionOperations
} from '../../../src/submission/service.ts'
import { IdGeneratorLive } from '../../../src/shared/id-generator.ts'
import {
  EmailSubmissionObject,
  EmailSubmissionHelpers
} from '../../../src/submission/schema.ts'
import { Common } from '../../../src/shared/common.ts'
import { testJMAPClient } from '../../utils/test-utils.ts'
import { sampleEmailSubmissions } from '../../fixtures/jmap-responses.ts'

describe('EmailSubmission Service', () => {
  const TestLayers = Layer.mergeAll(
    testJMAPClient,
    EmailSubmissionServiceLive,
    IdGeneratorLive
  )

  const runTest = <E, A>(effect: Effect.Effect<A, E, EmailSubmissionService | HttpClient.HttpClient>) =>
    Effect.runSync(Effect.provide(effect, TestLayers))

  describe('get method', () => {
    it('should get email submissions by IDs', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.get({
            accountId: 'test-account',
            ids: [Common.createId('submission-1'), Common.createId('submission-2')]
          })
        })
      )

      expect(result.accountId).toBe('test-account')
      expect(result.list).toHaveLength(2)
      expect(result.list[0].emailId).toBe('email-1')
    })

    it('should get all submissions when ids is null', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.get({
            accountId: 'test-account',
            ids: null
          })
        })
      )

      expect(result.list).toHaveLength(2)
    })

    it('should get submissions with specific properties', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.get({
            accountId: 'test-account',
            ids: [Common.createId('submission-1')],
            properties: ['id', 'emailId', 'undoStatus']
          })
        })
      )

      expect(result.list[0]).toHaveProperty('id')
      expect(result.list[0]).toHaveProperty('emailId')
      expect(result.list[0]).toHaveProperty('undoStatus')
    })
  })

  describe('set method', () => {
    it('should create a new submission', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.set({
            accountId: 'test-account',
            create: {
              'temp1': {
                identityId: Common.createId('identity-1'),
                emailId: Common.createId('email-1')
              }
            }
          })
        })
      )

      expect(result.created).toBeDefined()
      expect(result.created!['temp1']).toBeDefined()
      expect(result.created!['temp1'].id).toBeDefined()
      expect(result.created!['temp1'].sendAt).toBeDefined()
      expect(result.created!['temp1'].undoStatus).toBe('final')
    })

    it('should update a submission', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.set({
            accountId: 'test-account',
            update: {
              [Common.createId('submission-1')]: {
                undoStatus: 'canceled'
              }
            }
          })
        })
      )

      expect(result.updated).toBeDefined()
      expect(result.updated!['submission-1']).toBeDefined()
    })

    it('should destroy submissions', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.set({
            accountId: 'test-account',
            destroy: [Common.createId('submission-1')]
          })
        })
      )

      expect(result.destroyed).toBeDefined()
    })
  })

  describe('query method', () => {
    it('should query all submissions', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.query({
            accountId: 'test-account'
          })
        })
      )

      expect(result.accountId).toBe('test-account')
      expect(result.ids).toHaveLength(2)
    })

    it('should query with filter', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.query({
            accountId: 'test-account',
            filter: {
              undoStatus: 'pending'
            }
          })
        })
      )

      expect(result.ids).toBeDefined()
    })

    it('should query with limit', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.query({
            accountId: 'test-account',
            limit: Common.createUnsignedInt(5)
          })
        })
      )

      expect(result.ids).toBeDefined()
    })

    it('should query with sorting', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.query({
            accountId: 'test-account',
            sort: [{ property: 'sendAt', isAscending: false }]
          })
        })
      )

      expect(result.ids).toBeDefined()
    })
  })

  describe('queryChanges method', () => {
    it('should get query changes', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.queryChanges({
            accountId: 'test-account',
            sinceQueryState: 'submission-query-state-123'
          })
        })
      )

      expect(result.oldQueryState).toBe('submission-query-state-123')
      expect(result.newQueryState).toBe('submission-query-state-124')
      expect(result.added).toBeDefined()
    })
  })

  describe('changes method', () => {
    it('should get changes since a state', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.changes({
            accountId: 'test-account',
            sinceState: 'submission-state-123'
          })
        })
      )

      expect(result.oldState).toBe('submission-state-123')
      expect(result.newState).toBe('submission-state-124')
      expect(result.hasMoreChanges).toBe(false)
    })
  })

  describe('send method', () => {
    it('should send an email', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.send(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1')
          )
        })
      )

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.sendAt).toBeDefined()
      expect(result.undoStatus).toBeDefined()
    })

    it('should send with envelope', () => {
      const envelope = EmailSubmissionHelpers.createEnvelope(
        'sender@example.com',
        ['recipient@example.com']
      )

      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.send(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1'),
            { envelope }
          )
        })
      )

      expect(result).toBeDefined()
    })

    it('should send with sendAt', () => {
      const sendAt = Common.now()

      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.send(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1'),
            { sendAt }
          )
        })
      )

      expect(result).toBeDefined()
    })

    it('should send with onSuccessDestroyEmail', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.send(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1'),
            { onSuccessDestroyEmail: [Common.createId('draft-1')] }
          )
        })
      )

      expect(result).toBeDefined()
    })
  })

  describe('getDeliveryStatus method', () => {
    it('should get delivery status for a submission', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.getDeliveryStatus(
            'test-account',
            Common.createId('submission-1')
          )
        })
      )

      expect(result).toBeDefined()
      expect(result!.id).toBe('submission-1')
    })
  })

  describe('cancelScheduled method', () => {
    it('should cancel a scheduled submission', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.cancelScheduled(
            'test-account',
            Common.createId('submission-1')
          )
        })
      )

      expect(result).toBeDefined()
    })
  })

  describe('getByEmailId method', () => {
    it('should get submissions for a specific email', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.getByEmailId(
            'test-account',
            Common.createId('email-1')
          )
        })
      )

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getRecent method', () => {
    it('should get recent submissions', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.getRecent('test-account', 10)
        })
      )

      expect(Array.isArray(result)).toBe(true)
    })

    it('should use default limit', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailSubmissionService
          return yield* service.getRecent('test-account')
        })
      )

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('EmailSubmissionOperations', () => {
    describe('sendNow', () => {
      it('should send email immediately', () => {
        const result = runTest(
          EmailSubmissionOperations.sendNow(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1')
          )
        )

        expect(result).toBeDefined()
        expect(result.id).toBeDefined()
        expect(result.sendAt).toBeDefined()
        expect(result.undoStatus).toBeDefined()
      })
    })

    describe('sendLater', () => {
      it('should schedule email for later', () => {
        const sendAt = Common.now()

        const result = runTest(
          EmailSubmissionOperations.sendLater(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1'),
            sendAt
          )
        )

        expect(result).toBeDefined()
      })
    })

    describe('sendReply', () => {
      it('should send reply and mark original as answered', () => {
        const result = runTest(
          EmailSubmissionOperations.sendReply(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-2'),
            Common.createId('email-1')
          )
        )

        expect(result).toBeDefined()
      })
    })

    describe('sendAndDeleteDraft', () => {
      it('should send email and delete draft', () => {
        const result = runTest(
          EmailSubmissionOperations.sendAndDeleteDraft(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1')
          )
        )

        expect(result).toBeDefined()
      })
    })

    describe('getPendingSubmissions', () => {
      it('should get pending submissions', () => {
        const result = runTest(
          EmailSubmissionOperations.getPendingSubmissions('test-account')
        )

        expect(Array.isArray(result)).toBe(true)
      })
    })

    describe('getFailedSubmissions', () => {
      it('should get failed submissions', () => {
        const result = runTest(
          EmailSubmissionOperations.getFailedSubmissions('test-account')
        )

        expect(Array.isArray(result)).toBe(true)
      })
    })

    describe('retrySubmission', () => {
      it('should retry a failed submission', () => {
        const result = runTest(
          EmailSubmissionOperations.retrySubmission(
            'test-account',
            Common.createId('identity-1'),
            Common.createId('email-1'),
            Common.createId('submission-old')
          )
        )

        expect(result).toBeDefined()
      })
    })
  })
})
