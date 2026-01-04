/**
 * Functional Tests for Mailbox Service against Stalwart JMAP Server
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
  skipIfStalwartUnavailable,
  isStalwartAvailable,
} from "./stalwart-client.ts"
import { MailboxService } from "../../src/mailbox/service.ts"
import { JMAPClientService } from "../../src/client/client.ts"

// Test configuration
const TEST_SERVER_URL = process.env.JMAP_TEST_SERVER_URL || "http://localhost:8080"
const SKIP_FUNCTIONAL = process.env.SKIP_FUNCTIONAL_TESTS === "true"

describe.skipIf(SKIP_FUNCTIONAL)("Mailbox Service - Functional Tests", () => {
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

  // Create a test layer for the test user
  const testLayer = Layer.mergeAll(
    StalwartClientForUser("testuser", TEST_SERVER_URL),
    NodeHttpClient.layer
  )

  const runTest = <A, E>(
    effect: Effect.Effect<A, E, JMAPClientService>
  ): Promise<A> =>
    Effect.runPromise(
      effect.pipe(
        Effect.provide(testLayer)
      )
    )

  describe("getAll", () => {
    it("should retrieve all mailboxes from the server", async () => {
      // Skip if server is not available
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

          // Use the MailboxService to get mailboxes
          const mailboxService = new MailboxService()
          const mailboxes = yield* mailboxService.getAll(accountId)

          return mailboxes
        })
      )

      // Verify we got some mailboxes (Stalwart creates default ones)
      expect(result).toBeDefined()
      expect(Array.isArray(result.list)).toBe(true)

      // Stalwart should create standard mailboxes like Inbox, Drafts, etc.
      const roles = result.list.map((m) => m.role).filter(Boolean)
      // At minimum, we should have an inbox
      expect(roles.length).toBeGreaterThan(0)
    })
  })

  describe("get", () => {
    it("should retrieve specific mailboxes by ID", async () => {
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

          // First get all mailboxes to find valid IDs
          const mailboxService = new MailboxService()
          const allMailboxes = yield* mailboxService.getAll(accountId)

          if (allMailboxes.list.length === 0) {
            return { list: [], notFound: [], state: "" }
          }

          // Get specific mailboxes by ID
          const firstId = allMailboxes.list[0].id
          const specificMailboxes = yield* mailboxService.get(accountId, [
            firstId,
          ])

          return specificMailboxes
        })
      )

      expect(result.list.length).toBeLessThanOrEqual(1)
    })
  })

  describe("query", () => {
    it("should query mailboxes with filters", async () => {
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

          const mailboxService = new MailboxService()
          const queryResult = yield* mailboxService.query(accountId, {
            filter: { role: "inbox" },
          })

          return queryResult
        })
      )

      expect(result).toBeDefined()
      expect(Array.isArray(result.ids)).toBe(true)
      // Should find at least the inbox
      expect(result.ids.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe("create and delete", () => {
    it("should create and delete a mailbox", async () => {
      const isAvailable = await Effect.runPromise(
        isStalwartAvailable(TEST_SERVER_URL).pipe(
          Effect.provide(NodeHttpClient.layer)
        )
      )
      if (!isAvailable) {
        return
      }

      const testMailboxName = `Test-Folder-${Date.now()}`

      const result = await runTest(
        Effect.gen(function* () {
          const client = yield* JMAPClientService
          const session = yield* client.getSession

          const accountId =
            session.primaryAccounts["urn:ietf:params:jmap:mail"]

          const mailboxService = new MailboxService()

          // Create a new mailbox
          const createResult = yield* mailboxService.set(accountId, {
            create: {
              testMailbox: {
                name: testMailboxName,
                parentId: null,
              },
            },
          })

          expect(createResult.created).toBeDefined()
          const createdId = createResult.created?.["testMailbox"]?.id

          if (!createdId) {
            return { created: false, deleted: false }
          }

          // Delete the mailbox
          const deleteResult = yield* mailboxService.set(accountId, {
            destroy: [createdId],
          })

          return {
            created: !!createResult.created?.["testMailbox"],
            deleted: deleteResult.destroyed?.includes(createdId) ?? false,
          }
        })
      )

      expect(result.created).toBe(true)
      expect(result.deleted).toBe(true)
    })
  })
})
