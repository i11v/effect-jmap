import { describe, it, expect, beforeEach } from 'vitest'
import { Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform'
import { JMAPClientService } from '../../../src/core/JMAPClient.ts'
import { MailboxService, MailboxServiceLive, MailboxOperations } from '../../../src/services/Mailbox.ts'
import { Common } from '../../../src/schemas/Common.ts'
import { StandardRoles } from '../../../src/schemas/Mailbox.ts'
import { JMAPFixtures } from '../../fixtures/jmap-responses.ts'
import { TestUtils, testJMAPClient } from '../../utils/test-utils.ts'

describe('MailboxService', () => {
  const testLayer = Layer.provideMerge(MailboxServiceLive, testJMAPClient)

  describe('get', () => {
    it('should retrieve all mailboxes when ids is null', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.get({
          accountId: 'account-1',
          ids: null
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual({
        accountId: 'account-1',
        state: 'state-1',
        list: JMAPFixtures.mailboxes,
        notFound: []
      })
    })

    it('should retrieve specific mailboxes when ids provided', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.get({
          accountId: 'account-1',
          ids: [Common.createId('mailbox-1')]
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result.accountId).toBe('account-1')
      expect(result.list).toEqual(JMAPFixtures.mailboxes)
    })
  })

  describe('query', () => {
    it('should query mailboxes with filters', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.query({
          accountId: 'account-1',
          filter: {
            role: 'inbox'
          }
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual({
        accountId: 'account-1',
        queryState: 'query-state-1',
        canCalculateChanges: true,
        position: 0,
        ids: ['mailbox-1'],
        total: 1
      })
    })
  })

  describe('getAll', () => {
    it('should retrieve all mailboxes for an account', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.getAll('account-1')
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual(JMAPFixtures.mailboxes)
    })
  })

  describe('findByRole', () => {
    it('should find mailboxes by role', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.findByRole('account-1', StandardRoles.INBOX)
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual(JMAPFixtures.mailboxes)
    })
  })

  describe('create', () => {
    it('should create a new mailbox', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.create('account-1', {
          name: 'New Folder',
          sortOrder: Common.createUnsignedInt(10)
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result.id).toContain('mailbox-')
      expect(result.name).toBe('New Folder')
      expect(result.sortOrder).toBe(10)
      expect(result.parentId).toBeNull()
    })
  })

  describe('update', () => {
    it('should update an existing mailbox', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.update('account-1', Common.createId('mailbox-1'), {
          name: 'Updated Name'
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toBeTruthy()
      expect(result!.name).toBe('Updated Name')
    })
  })

  describe('destroy', () => {
    it('should delete mailboxes', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.destroy('account-1', [Common.createId('mailbox-1')])
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual([Common.createId('mailbox-1')])
    })
  })
})

describe('MailboxOperations', () => {
  const testLayer = Layer.provideMerge(MailboxServiceLive, testJMAPClient)

  describe('getInbox', () => {
    it('should find the inbox mailbox', async () => {
      const effect = MailboxOperations.getInbox('account-1')

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toBeTruthy()
      expect(result!.role).toBe('inbox')
      expect(result!.name).toBe('Inbox')
    })
  })

  describe('createHierarchy', () => {
    it('should create nested mailbox structure', async () => {
      const effect = MailboxOperations.createHierarchy('account-1', ['Projects', 'Work', 'Client A'])

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      // The mock returns dynamically generated mailboxes
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Projects')
      expect(result[1].name).toBe('Work')
      expect(result[2].name).toBe('Client A')
    })
  })
})