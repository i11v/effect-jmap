import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { Schema } from 'effect'
import { HttpClient } from '@effect/platform'
import {
  EmailService,
  EmailServiceLive,
  EmailOperations
} from '../../../src/services/Email.ts'
import {
  Email,
  EmailGetResponse,
  EmailSetResponse,
  EmailQueryResponse,
  EmailHelpers,
  StandardProperties
} from '../../../src/schemas/Email.ts'
import { Common, StandardKeywords } from '../../../src/schemas/Common.ts'
import { JMAPClient } from '../../../src/core/JMAPClient.ts'
import { testJMAPClient } from '../../utils/test-utils.ts'
import {
  mockEmailGetResponse,
  mockEmailSetResponse,
  mockEmailQueryResponse,
  sampleEmails
} from '../../fixtures/jmap-responses.ts'

describe('Email Service', () => {
  const TestLayers = Layer.mergeAll(
    testJMAPClient,
    EmailServiceLive
  )

  const runTest = <E, A>(effect: Effect.Effect<A, E, EmailService | HttpClient.HttpClient>) =>
    Effect.runSync(Effect.provide(effect, TestLayers))

  describe('get method', () => {
    it('should get emails by IDs', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.get({
            accountId: 'test-account',
            ids: [Common.createId('email1'), Common.createId('email2')]
          })
        })
      )

      expect(result.accountId).toBe('test-account')
      expect(result.list).toHaveLength(2)
      expect(result.list[0].subject).toBe('Test Email 1')
    })

    it('should get all emails when ids is null', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.get({
            accountId: 'test-account',
            ids: null
          })
        })
      )

      expect(result.list).toHaveLength(2)
    })

    it('should get emails with body values', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.get({
            accountId: 'test-account',
            ids: [Common.createId('email1')],
            fetchAllBodyValues: true,
            maxBodyValueBytes: Common.createUnsignedInt(10240)
          })
        })
      )

      const email = result.list[0]
      expect(email.bodyValues).toBeDefined()
      expect(email.bodyValues!['1']?.value).toContain('This is the email content')
    })

    it('should get emails with specific properties', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.get({
            accountId: 'test-account',
            ids: [Common.createId('email1')],
            properties: ['id', 'subject', 'from']
          })
        })
      )

      expect(result.list[0]).toHaveProperty('id')
      expect(result.list[0]).toHaveProperty('subject')
      expect(result.list[0]).toHaveProperty('from')
    })
  })

  describe('set method', () => {
    it('should update email properties', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.set({
            accountId: 'test-account',
            update: {
              [Common.createId('email1')]: {
                keywords: {
                  [StandardKeywords.SEEN]: true,
                  [StandardKeywords.FLAGGED]: true
                }
              }
            }
          })
        })
      )

      expect(result.updated).toBeDefined()
      const updatedEmail = result.updated![Common.createId('email1')]
      expect(updatedEmail).toBeDefined()
    })

    it('should move email between mailboxes', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.set({
            accountId: 'test-account',
            update: {
              [Common.createId('email1')]: {
                mailboxIds: {
                  [Common.createId('inbox')]: false,
                  [Common.createId('archive')]: true
                }
              }
            }
          })
        })
      )

      expect(result.updated).toBeDefined()
    })

    it('should destroy emails', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.set({
            accountId: 'test-account',
            destroy: [Common.createId('email1'), Common.createId('email2')]
          })
        })
      )

      expect(result.destroyed).toEqual([Common.createId('email1'), Common.createId('email2')])
    })
  })

  describe('query method', () => {
    it('should query emails with filters', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.query({
            accountId: 'test-account',
            filter: {
              inMailbox: Common.createId('inbox'),
              hasKeyword: StandardKeywords.SEEN
            },
            limit: Common.createUnsignedInt(10)
          })
        })
      )

      expect(result.ids).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should query with text search', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.query({
            accountId: 'test-account',
            filter: {
              text: 'important',
              from: 'sender@example.com'
            }
          })
        })
      )

      expect(result.ids).toBeDefined()
    })

    it('should query with sorting', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.query({
            accountId: 'test-account',
            sort: [{ property: 'receivedAt', isAscending: false }],
            calculateTotal: true
          })
        })
      )

      expect(result.canCalculateChanges).toBe(true)
    })

    it('should support thread collapsing', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.query({
            accountId: 'test-account',
            collapseThreads: true
          })
        })
      )

      expect(result.collapseThreads).toBe(true)
    })
  })

  describe('copy method', () => {
    it('should copy emails between accounts', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.copy({
            fromAccountId: 'source-account',
            accountId: 'target-account',
            create: {
              'temp1': {
                id: Common.createId('email1'),
                mailboxIds: {
                  [Common.createId('inbox')]: true
                }
              }
            }
          })
        })
      )

      expect(result.created).toBeDefined()
      expect(result.fromAccountId).toBe('source-account')
      expect(result.accountId).toBe('target-account')
    })
  })

  describe('import method', () => {
    it('should import emails from blobs', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.import({
            accountId: 'test-account',
            emails: {
              'import1': {
                blobId: 'blob123',
                mailboxIds: {
                  [Common.createId('inbox')]: true
                },
                keywords: {
                  [StandardKeywords.DRAFT]: true
                }
              }
            }
          })
        })
      )

      expect(result.created).toBeDefined()
    })
  })

  describe('convenience methods', () => {
    it('should get emails by mailbox', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.getByMailbox(
            'test-account',
            Common.createId('inbox'),
            {
              limit: 5,
              properties: StandardProperties.ENVELOPE
            }
          )
        })
      )

      expect(result).toHaveLength(1)
      expect(result[0].subject).toBe('Test Email 1')
    })

    it('should search emails', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.search(
            'test-account',
            'important message',
            {
              limit: 10,
              mailboxId: Common.createId('inbox')
            }
          )
        })
      )

      expect(result).toBeDefined()
    })

    it('should get unread emails', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.getUnread(
            'test-account',
            Common.createId('inbox'),
            10
          )
        })
      )

      expect(result).toHaveLength(1)
    })

    it('should mark emails as read', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.markRead(
            'test-account',
            [Common.createId('email1'), Common.createId('email2')],
            true
          )
        })
      )

      expect(result).toBeDefined()
    })

    it('should flag emails', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.flag(
            'test-account',
            [Common.createId('email1')],
            true
          )
        })
      )

      expect(result).toBeDefined()
    })

    it('should move emails between mailboxes', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.move(
            'test-account',
            [Common.createId('email1')],
            Common.createId('inbox'),
            Common.createId('archive')
          )
        })
      )

      expect(result).toBeDefined()
    })

    it('should update keywords', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.updateKeywords(
            'test-account',
            [Common.createId('email1')],
            ['important', 'work'],
            [StandardKeywords.DRAFT]
          )
        })
      )

      expect(result).toBeDefined()
    })

    it('should get emails with full content', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.getWithContent(
            'test-account',
            [Common.createId('email1')],
            10240
          )
        })
      )

      expect(result).toHaveLength(1)
      expect(result[0].bodyValues).toBeDefined()
    })

    it('should get single email content', () => {
      const result = runTest(
        Effect.gen(function* () {
          const service = yield* EmailService
          return yield* service.getEmailContent(
            'test-account',
            Common.createId('email1'),
            10240
          )
        })
      )

      expect(result).toBeDefined()
      expect(result?.bodyValues).toBeDefined()
    })
  })
})

describe('EmailOperations', () => {
  const TestLayers = Layer.mergeAll(
    testJMAPClient,
    EmailServiceLive
  )

  const runTest = <E, A>(effect: Effect.Effect<A, E, EmailService | HttpClient.HttpClient>) =>
    Effect.runSync(Effect.provide(effect, TestLayers))

  it('should get recent inbox emails', () => {
    const result = runTest(EmailOperations.getRecentInboxEmails('test-account', Common.createId('inbox'), 5))
    expect(result).toBeDefined()
  })

  it('should get recent inbox emails with content', () => {
    const result = runTest(EmailOperations.getRecentInboxEmailsWithContent('test-account', Common.createId('inbox'), 5))
    expect(result).toBeDefined()
    // Should return emails with body content when available
    if (result.length > 0) {
      expect(result[0].bodyValues).toBeDefined()
    }
  })

  it('should get email thread', () => {
    const result = runTest(
      EmailOperations.getEmailThread('test-account', Common.createId('thread1'))
    )
    expect(result).toBeDefined()
  })

  it('should mark mailbox as read', () => {
    const result = runTest(
      EmailOperations.markMailboxRead('test-account', Common.createId('inbox'))
    )
    expect(result).toBeDefined()
  })

  it('should delete emails', () => {
    const result = runTest(
      EmailOperations.deleteEmails(
        'test-account',
        [Common.createId('email1')],
        Common.createId('trash')
      )
    )
    expect(result).toBeDefined()
  })

  it('should archive emails', () => {
    const result = runTest(
      EmailOperations.archiveEmails(
        'test-account',
        [Common.createId('email1')],
        Common.createId('archive')
      )
    )
    expect(result).toBeDefined()
  })
})