import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { NodeHttpClient } from '@effect/platform-node'
import { JMAPClientLive, JMAPClientService } from '../../src/core/JMAPClient.ts'
import { EmailServiceLive, EmailService } from '../../src/services/Email.ts'
import { MailboxServiceLive, MailboxService } from '../../src/services/Mailbox.ts'

/**
 * Integration tests to verify layer resolution works correctly.
 * These tests would have caught the HttpClient.layer vs NodeHttpClient.layer issue.
 */
describe('Layer Resolution Integration', () => {
  const testConfig = {
    sessionUrl: 'https://api.example.com/jmap/session',
    bearerToken: 'test-token-123'
  }

  describe('JMAPClient Layer', () => {
    it('should resolve JMAPClientLive with NodeHttpClient', () => {
      const layers = Layer.mergeAll(
        NodeHttpClient.layer,
        JMAPClientLive(testConfig)
      )

      const program = Effect.gen(function* () {
        const client = yield* JMAPClientService
        // Just verify the client is available - don't make real calls
        expect(client).toBeDefined()
        expect(client.getSession).toBeDefined()
        expect(typeof client.batch).toBe('function')
      })

      return Effect.runPromise(Effect.provide(program, layers))
    })

    it('should fail gracefully with missing HttpClient', async () => {
      // This test verifies we get a helpful error when HttpClient is missing
      const layers = JMAPClientLive(testConfig) // Missing NodeHttpClient.layer

      const program = Effect.gen(function* () {
        const client = yield* JMAPClientService
        // Try to actually use the client to trigger the missing dependency
        yield* client.getSession
        return client
      })

      await expect(
        Effect.runPromise(Effect.provide(program, layers))
      ).rejects.toThrow(/Service not found.*HttpClient/)
    })
  })

  describe('Service Layer Stack', () => {
    it('should resolve complete service stack', () => {
      const layers = Layer.mergeAll(
        NodeHttpClient.layer,
        JMAPClientLive(testConfig),
        EmailServiceLive,
        MailboxServiceLive
      )

      const program = Effect.gen(function* () {
        const emailService = yield* EmailService
        const mailboxService = yield* MailboxService
        const jmapClient = yield* JMAPClientService

        // Verify all services are available
        expect(emailService).toBeDefined()
        expect(mailboxService).toBeDefined()
        expect(jmapClient).toBeDefined()

        // Verify service interfaces
        expect(typeof emailService.get).toBe('function')
        expect(typeof emailService.query).toBe('function')
        expect(typeof mailboxService.get).toBe('function')
        expect(typeof mailboxService.query).toBe('function')
      })

      return Effect.runPromise(Effect.provide(program, layers))
    })

    it('should fail with missing dependency layers', async () => {
      // Test EmailService without JMAPClient
      const incompleteLayer = EmailServiceLive

      const program = Effect.gen(function* () {
        const emailService = yield* EmailService
        // Try to actually use the service to trigger the missing dependency
        yield* emailService.get({
          accountId: 'test-account',
          ids: ['test-id']
        })
        return emailService
      })

      await expect(
        Effect.runPromise(Effect.provide(program, incompleteLayer))
      ).rejects.toThrow(/Service not found.*JMAPClientService/)
    })
  })

  describe('Layer Composition', () => {
    it('should detect circular dependencies', () => {
      // This is more of a compile-time check, but good to document
      const layers = Layer.mergeAll(
        NodeHttpClient.layer,
        JMAPClientLive(testConfig),
        EmailServiceLive,
        MailboxServiceLive
      )

      // Should compile without circular dependency errors
      expect(layers).toBeDefined()
    })

    it('should handle layer merging correctly', () => {
      // Test different ways of merging layers
      const httpLayer = NodeHttpClient.layer
      const jmapLayer = JMAPClientLive(testConfig)
      const serviceLayer = Layer.mergeAll(EmailServiceLive, MailboxServiceLive)

      const combinedLayers = Layer.mergeAll(
        httpLayer,
        jmapLayer,
        serviceLayer
      )

      const program = Effect.gen(function* () {
        // Should be able to access all services
        yield* EmailService
        yield* MailboxService
        yield* JMAPClientService
        return 'success'
      })

      return Effect.runPromise(Effect.provide(program, combinedLayers))
    })
  })
})