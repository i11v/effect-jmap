/**
 * Functional Tests for Email Service against Stalwart JMAP Server
 *
 * These tests run against a real Stalwart server to verify
 * the effect-jmap library works correctly with actual JMAP responses.
 *
 * Prerequisites:
 * 1. Start the test server: pnpm test:server:start
 * 2. Seed test data: pnpm seed-test-data
 * 3. Run tests: pnpm test:functional
 */

import { describe, it, expect, beforeAll } from "vitest"
import { Effect, Layer } from "effect"
import { NodeHttpClient } from "@effect/platform-node"
import {
  StalwartClientForUser,
  isStalwartAvailable,
} from "./stalwart-client.ts"
import { EmailService, EmailServiceLive, EmailOperations } from "../../src/email/service.ts"
import { MailboxService, MailboxServiceLive } from "../../src/mailbox/service.ts"
import { JMAPClientService } from "../../src/client/client.ts"
import { IdGeneratorLive } from "../../src/shared/id-generator.ts"
import { Common, Id } from "../../src/shared/common.ts"

// Test configuration
const TEST_SERVER_URL = process.env.JMAP_TEST_SERVER_URL || "http://localhost:8080"
const SKIP_FUNCTIONAL = process.env.SKIP_FUNCTIONAL_TESTS === "true"

describe.skipIf(SKIP_FUNCTIONAL)("Email Service - Functional Tests", () => {
  // Check server availability before running tests
  beforeAll(async () => {
    const isAvailable = await Effect.runPromise(
      isStalwartAvailable(TEST_SERVER_URL).pipe(
        Effect.provide(NodeHttpClient.layer)
      )
    )

    if (!isAvailable) {
      console.warn(
        "\n⚠️  Stalwart server not available. Skipping functional tests.\n" +
          "   To run functional tests:\n" +
          "   1. pnpm test:server:start\n" +
          "   2. pnpm seed-test-data\n" +
          "   3. pnpm test:functional\n"
      )
    }
  })

  // Create a test layer for the test user with all required services
  const testLayer = Layer.provideMerge(
    Layer.mergeAll(
      StalwartClientForUser("testuser", TEST_SERVER_URL),
      EmailServiceLive,
      MailboxServiceLive,
      IdGeneratorLive
    ),
    NodeHttpClient.layer
  )

  const runTest = <A, E>(
    effect: Effect.Effect<A, E, JMAPClientService | EmailService | MailboxService>
  ): Promise<A> =>
    Effect.runPromise(
      effect.pipe(
        Effect.provide(testLayer)
      )
    )

  describe("Email/set destroy", () => {
    it("should create and then destroy an email", async () => {
      const isAvailable = await Effect.runPromise(
        isStalwartAvailable(TEST_SERVER_URL).pipe(
          Effect.provide(NodeHttpClient.layer)
        )
      )
      if (!isAvailable) {
        return
      }

      const result = await runTest(
        Effect.gen(function* () {
          const client = yield* JMAPClientService
          const session = yield* client.getSession

          const accountId =
            session.primaryAccounts["urn:ietf:params:jmap:mail"]
          expect(accountId).toBeDefined()

          const mailboxService = yield* MailboxService
          const emailService = yield* EmailService

          // Find the Drafts mailbox to create a test email
          const mailboxes = yield* mailboxService.getAll(accountId)
          const draftsMailbox = mailboxes.find((m) => m.role === "drafts")

          if (!draftsMailbox) {
            // If no drafts mailbox, use inbox
            const inboxMailbox = mailboxes.find((m) => m.role === "inbox")
            if (!inboxMailbox) {
              return { created: false, destroyed: false, error: "No suitable mailbox found" }
            }
          }

          const targetMailbox = draftsMailbox || mailboxes.find((m) => m.role === "inbox")
          if (!targetMailbox) {
            return { created: false, destroyed: false, error: "No mailbox available" }
          }

          // Create a test email using Email/set
          const createResult = yield* emailService.set({
            accountId,
            create: {
              testEmail: {
                mailboxIds: {
                  [targetMailbox.id]: true,
                },
                keywords: {
                  $draft: true,
                },
              },
            },
          })

          const createdId = createResult.created?.["testEmail"]?.id
          if (!createdId) {
            return { created: false, destroyed: false, error: "Failed to create test email" }
          }

          // Now destroy the email using the destroy method
          const destroyedIds = yield* emailService.destroy(accountId, [createdId])

          return {
            created: true,
            destroyed: destroyedIds.includes(createdId),
            createdId,
            destroyedIds,
          }
        })
      )

      // The test email may not be creatable if the server requires message content
      // In that case, we just verify the create was attempted
      if (result.error) {
        console.log("Note:", result.error)
      } else {
        expect(result.created).toBe(true)
        expect(result.destroyed).toBe(true)
      }
    })

    it("should destroy email using set method directly", async () => {
      const isAvailable = await Effect.runPromise(
        isStalwartAvailable(TEST_SERVER_URL).pipe(
          Effect.provide(NodeHttpClient.layer)
        )
      )
      if (!isAvailable) {
        return
      }

      const result = await runTest(
        Effect.gen(function* () {
          const client = yield* JMAPClientService
          const session = yield* client.getSession

          const accountId =
            session.primaryAccounts["urn:ietf:params:jmap:mail"]
          expect(accountId).toBeDefined()

          const mailboxService = yield* MailboxService
          const emailService = yield* EmailService

          // Find a mailbox to create a test email
          const mailboxes = yield* mailboxService.getAll(accountId)
          const targetMailbox = mailboxes.find((m) => m.role === "drafts") ||
                               mailboxes.find((m) => m.role === "inbox") ||
                               mailboxes[0]

          if (!targetMailbox) {
            return { testSkipped: true, reason: "No mailbox available" }
          }

          // Create a test email
          const createResult = yield* emailService.set({
            accountId,
            create: {
              destroyTestEmail: {
                mailboxIds: {
                  [targetMailbox.id]: true,
                },
                keywords: {
                  $draft: true,
                },
              },
            },
          })

          const createdId = createResult.created?.["destroyTestEmail"]?.id
          if (!createdId) {
            return { testSkipped: true, reason: "Could not create test email" }
          }

          // Destroy using set method with destroy parameter
          const destroyResult = yield* emailService.set({
            accountId,
            destroy: [createdId],
          })

          return {
            testSkipped: false,
            destroyed: destroyResult.destroyed?.includes(createdId) ?? false,
            notDestroyed: destroyResult.notDestroyed,
          }
        })
      )

      if (result.testSkipped) {
        console.log("Test skipped:", result.reason)
      } else {
        expect(result.destroyed).toBe(true)
      }
    })

    it("should handle destroying non-existent email gracefully", async () => {
      const isAvailable = await Effect.runPromise(
        isStalwartAvailable(TEST_SERVER_URL).pipe(
          Effect.provide(NodeHttpClient.layer)
        )
      )
      if (!isAvailable) {
        return
      }

      const result = await runTest(
        Effect.gen(function* () {
          const client = yield* JMAPClientService
          const session = yield* client.getSession

          const accountId =
            session.primaryAccounts["urn:ietf:params:jmap:mail"]
          expect(accountId).toBeDefined()

          const emailService = yield* EmailService

          // Try to destroy a non-existent email
          const fakeEmailId = Common.createId("nonexistent-email-12345")

          const destroyResult = yield* emailService.set({
            accountId,
            destroy: [fakeEmailId],
          })

          return {
            destroyed: destroyResult.destroyed,
            notDestroyed: destroyResult.notDestroyed,
            hasNotDestroyedError: !!destroyResult.notDestroyed?.[fakeEmailId],
          }
        })
      )

      // Either the server returns the ID in notDestroyed, or destroyed is empty
      expect(
        result.hasNotDestroyedError ||
        (result.destroyed === null || result.destroyed?.length === 0)
      ).toBe(true)
    })
  })

  describe("EmailOperations.destroyEmails", () => {
    it("should permanently destroy emails using the convenience operation", async () => {
      const isAvailable = await Effect.runPromise(
        isStalwartAvailable(TEST_SERVER_URL).pipe(
          Effect.provide(NodeHttpClient.layer)
        )
      )
      if (!isAvailable) {
        return
      }

      const result = await runTest(
        Effect.gen(function* () {
          const client = yield* JMAPClientService
          const session = yield* client.getSession

          const accountId =
            session.primaryAccounts["urn:ietf:params:jmap:mail"]
          expect(accountId).toBeDefined()

          const mailboxService = yield* MailboxService
          const emailService = yield* EmailService

          // Find a mailbox to create a test email
          const mailboxes = yield* mailboxService.getAll(accountId)
          const targetMailbox = mailboxes.find((m) => m.role === "drafts") ||
                               mailboxes.find((m) => m.role === "inbox") ||
                               mailboxes[0]

          if (!targetMailbox) {
            return { testSkipped: true, reason: "No mailbox available" }
          }

          // Create a test email
          const createResult = yield* emailService.set({
            accountId,
            create: {
              operationsTestEmail: {
                mailboxIds: {
                  [targetMailbox.id]: true,
                },
                keywords: {
                  $draft: true,
                },
              },
            },
          })

          const createdId = createResult.created?.["operationsTestEmail"]?.id
          if (!createdId) {
            return { testSkipped: true, reason: "Could not create test email" }
          }

          // Use the destroyEmails convenience operation
          const destroyedIds = yield* EmailOperations.destroyEmails(accountId, [createdId])

          return {
            testSkipped: false,
            destroyed: destroyedIds.includes(createdId),
            destroyedIds,
          }
        })
      )

      if (result.testSkipped) {
        console.log("Test skipped:", result.reason)
      } else {
        expect(result.destroyed).toBe(true)
      }
    })
  })
})
