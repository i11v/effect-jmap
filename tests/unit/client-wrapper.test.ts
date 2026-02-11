import { describe, it, expect, afterEach } from 'vitest'
import { Layer } from 'effect'
import { createJMAPClientFromLayer, type JMAPClientWrapper } from '../../src/client/wrapper.ts'
import { MailboxServiceLive } from '../../src/mailbox/service.ts'
import { EmailServiceLive } from '../../src/email/service.ts'
import { EmailSubmissionServiceLive } from '../../src/submission/service.ts'
import { IdGeneratorLive } from '../../src/shared/id-generator.ts'
import { testJMAPClient } from '../utils/test-utils.ts'
import { JMAPFixtures } from '../fixtures/jmap-responses.ts'

/**
 * Build a test layer that mirrors JMAPLive but uses the mock client.
 */
const testLayer = Layer.mergeAll(
  testJMAPClient,
  MailboxServiceLive,
  EmailServiceLive,
  EmailSubmissionServiceLive,
  IdGeneratorLive,
)

describe('JMAPClientWrapper (createJMAPClient)', () => {
  let client: JMAPClientWrapper

  afterEach(async () => {
    if (client) {
      await client.dispose()
    }
  })

  describe('creation', () => {
    it('should create a client from a layer', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)

      expect(client).toBeDefined()
      expect(client.accountId).toBe('account-1')
      expect(client.session).toBeDefined()
      expect(client.session.apiUrl).toBe(JMAPFixtures.session.apiUrl)
    })

    it('should expose the primary account ID', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)

      expect(client.accountId).toBe(
        JMAPFixtures.session.primaryAccounts['urn:ietf:params:jmap:mail'],
      )
    })

    it('should expose the full session object', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)

      expect(client.session.username).toBe('test@example.com')
      expect(client.session.accounts).toBeDefined()
    })
  })

  describe('mailbox namespace', () => {
    it('should get all mailboxes using auto-discovered accountId', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      const mailboxes = await client.mailbox.getAll()

      expect(mailboxes).toEqual(JMAPFixtures.mailboxes)
    })

    it('should allow explicit accountId override', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      const mailboxes = await client.mailbox.getAll('account-1')

      expect(mailboxes).toEqual(JMAPFixtures.mailboxes)
    })

    it('should query mailboxes', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      const result = await client.mailbox.query({
        accountId: 'account-1',
        filter: { role: 'inbox' },
      })

      expect(result.ids).toEqual(['mailbox-1'])
    })

    it('should get mailboxes by args', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      const result = await client.mailbox.get({
        accountId: 'account-1',
        ids: null,
      })

      expect(result.list).toEqual(JMAPFixtures.mailboxes)
      expect(result.state).toBe('state-1')
    })
  })

  describe('email namespace', () => {
    it('should query emails', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      const result = await client.email.query({
        accountId: 'account-1',
        filter: {},
      })

      expect(result).toBeDefined()
      expect(result.ids).toBeDefined()
    })

    it('should get emails by args', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      const result = await client.email.get({
        accountId: 'account-1',
        ids: null,
      })

      expect(result).toBeDefined()
      expect(result.list).toBeDefined()
    })
  })

  describe('dispose', () => {
    it('should dispose without error', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      await expect(client.dispose()).resolves.toBeUndefined()
    })
  })

  describe('batch', () => {
    it('should expose low-level batch API', async () => {
      client = await createJMAPClientFromLayer(testLayer as any)
      const response = await client.batch([
        ['Mailbox/get', { accountId: 'account-1', ids: null }, 'call-1'],
      ])

      expect(response.methodResponses).toBeDefined()
      expect(response.methodResponses.length).toBeGreaterThan(0)
    })
  })
})
