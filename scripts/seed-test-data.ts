/**
 * Seed Test Data Script for Stalwart JMAP Server
 *
 * This script initializes the Stalwart test server with:
 * - A test domain
 * - Test user accounts
 * - Sample mailboxes and emails
 *
 * Usage: pnpm seed-test-data
 */

import { Effect, Console, Schedule, Duration, pipe } from "effect"
import { NodeRuntime } from "@effect/platform-node"
import { HttpClient, HttpClientRequest, HttpBody } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { execSync } from "child_process"
import * as crypto from "crypto"

// Test configuration
const TEST_CONFIG = {
  baseUrl: "http://localhost:8080",
  adminUsername: "admin",
  adminPassword: "test-admin-password",
  domain: "test.local",
  users: [
    {
      name: "testuser",
      password: "testpassword123",
      description: "Test User",
      emails: ["testuser@test.local"],
    },
    {
      name: "alice",
      password: "alicepassword123",
      description: "Alice Smith",
      emails: ["alice@test.local", "alice.smith@test.local"],
    },
    {
      name: "bob",
      password: "bobpassword123",
      description: "Bob Jones",
      emails: ["bob@test.local"],
    },
  ],
}

// Helper to create Basic auth header
const basicAuth = (username: string, password: string): string => {
  const credentials = Buffer.from(`${username}:${password}`).toString("base64")
  return `Basic ${credentials}`
}

// Helper to hash password using SHA-512 crypt format (for Stalwart)
const hashPassword = (password: string): string => {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString("base64").replace(/[+/=]/g, "").slice(0, 16)
  // Use openssl to generate SHA-512 crypt hash
  try {
    const hash = execSync(`openssl passwd -6 -salt "${salt}" "${password}"`, { encoding: "utf-8" }).trim()
    return hash
  } catch {
    // Fallback: use plain text with $plain$ prefix if openssl fails
    return `$plain$${password}`
  }
}

// Management API client
const managementRequest = <T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient

    let request = HttpClientRequest.make(method)(`${TEST_CONFIG.baseUrl}${path}`).pipe(
      HttpClientRequest.setHeader("Authorization", basicAuth(TEST_CONFIG.adminUsername, TEST_CONFIG.adminPassword)),
      HttpClientRequest.setHeader("Content-Type", "application/json")
    )

    if (body) {
      request = HttpClientRequest.setBody(request, HttpBody.text(JSON.stringify(body), "application/json"))
    }

    const response = yield* httpClient.execute(request)
    const text = yield* response.text

    if (response.status >= 400) {
      yield* Effect.fail(new Error(`HTTP ${response.status}: ${text}`))
    }

    return text ? (JSON.parse(text) as T) : (null as T)
  })

// Wait for server to be ready
const waitForServer = pipe(
  Effect.gen(function* () {
    yield* Console.log("Waiting for Stalwart server to be ready...")
    const httpClient = yield* HttpClient.HttpClient

    const request = HttpClientRequest.get(`${TEST_CONFIG.baseUrl}/.well-known/jmap`)
    const response = yield* httpClient.execute(request)

    // Accept 200 or 307 (redirect to /jmap/session) as ready
    if (response.status !== 200 && response.status !== 307) {
      yield* Effect.fail(new Error(`Server not ready: HTTP ${response.status}`))
    }

    yield* Console.log("Server is ready!")
  }),
  Effect.retry(
    Schedule.exponential(Duration.seconds(1)).pipe(
      Schedule.intersect(Schedule.recurs(30))
    )
  ),
  Effect.catchAll((error) =>
    Effect.fail(new Error(`Server did not become ready: ${error}`))
  )
)

// Create domain
const createDomain = Effect.gen(function* () {
  yield* Console.log(`Creating domain: ${TEST_CONFIG.domain}`)

  yield* managementRequest("POST", "/api/principal", {
    type: "domain",
    name: TEST_CONFIG.domain,
  }).pipe(
    Effect.catchAll((error) => {
      // Ignore "already exists" errors
      if (String(error).includes("already exists")) {
        return Console.log(`Domain ${TEST_CONFIG.domain} already exists`)
      }
      return Effect.fail(error)
    })
  )

  yield* Console.log(`Domain ${TEST_CONFIG.domain} created`)
})

// Create user account
const createUser = (user: (typeof TEST_CONFIG.users)[number]) =>
  Effect.gen(function* () {
    yield* Console.log(`Creating user: ${user.name}`)

    // Hash the password using SHA-512 crypt format
    const hashedPassword = hashPassword(user.password)

    yield* managementRequest("POST", "/api/principal", {
      type: "individual",
      name: user.name,
      secrets: [hashedPassword],
      description: user.description,
      emails: user.emails,
      roles: ["user"],  // Required for JMAP access
    }).pipe(
      Effect.catchAll((error) => {
        // Ignore "already exists" errors
        if (String(error).includes("already exists")) {
          return Console.log(`User ${user.name} already exists`)
        }
        return Effect.fail(error)
      })
    )

    yield* Console.log(`User ${user.name} created with email(s): ${user.emails.join(", ")}`)
  })

// Send a test email via JMAP
const sendTestEmail = (
  fromUser: string,
  fromPassword: string,
  toEmail: string,
  subject: string,
  body: string
) =>
  Effect.gen(function* () {
    yield* Console.log(`Sending test email from ${fromUser} to ${toEmail}`)
    const httpClient = yield* HttpClient.HttpClient

    // First get the session to find the account ID and API URL
    // Use /jmap/session directly since /.well-known/jmap redirects there
    const sessionRequest = HttpClientRequest.get(`${TEST_CONFIG.baseUrl}/jmap/session`).pipe(
      HttpClientRequest.setHeader("Authorization", basicAuth(fromUser, fromPassword))
    )

    const sessionResponse = yield* httpClient.execute(sessionRequest)
    const sessionText = yield* sessionResponse.text
    const session = JSON.parse(sessionText) as {
      primaryAccounts: Record<string, string>
      apiUrl: string
    }

    const accountId = session.primaryAccounts["urn:ietf:params:jmap:mail"]

    // Fix apiUrl if it contains Docker container hostname
    const baseUrlParsed = new URL(TEST_CONFIG.baseUrl)
    const apiUrlParsed = new URL(session.apiUrl)
    apiUrlParsed.host = baseUrlParsed.host
    apiUrlParsed.protocol = baseUrlParsed.protocol
    const apiUrl = apiUrlParsed.toString()

    // Get the Drafts mailbox ID
    const getMailboxRequest: unknown = {
      using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
      methodCalls: [
        [
          "Mailbox/query",
          {
            accountId,
            filter: { role: "drafts" },
          },
          "0",
        ],
      ],
    }

    const mailboxReq = HttpClientRequest.post(apiUrl).pipe(
      HttpClientRequest.setHeader("Authorization", basicAuth(fromUser, fromPassword)),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.setBody(HttpBody.text(JSON.stringify(getMailboxRequest), "application/json"))
    )

    const mailboxResponse = yield* httpClient.execute(mailboxReq)
    const mailboxText = yield* mailboxResponse.text
    const mailboxResult = JSON.parse(mailboxText) as {
      methodResponses: [string, { ids?: string[] }, string][]
    }

    const draftsMailboxId = mailboxResult.methodResponses[0]?.[1]?.ids?.[0]

    if (!draftsMailboxId) {
      yield* Console.log("Drafts mailbox not found, skipping email creation")
      return
    }

    // Create the email
    const createEmailRequest: unknown = {
      using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail", "urn:ietf:params:jmap:submission"],
      methodCalls: [
        [
          "Email/set",
          {
            accountId,
            create: {
              draft1: {
                mailboxIds: { [draftsMailboxId]: true },
                from: [{ email: `${fromUser}@${TEST_CONFIG.domain}` }],
                to: [{ email: toEmail }],
                subject,
                bodyStructure: {
                  type: "text/plain",
                  partId: "1",
                },
                bodyValues: {
                  "1": {
                    value: body,
                    isEncodingProblem: false,
                    isTruncated: false,
                  },
                },
              },
            },
          },
          "0",
        ],
      ],
    }

    const createReq = HttpClientRequest.post(apiUrl).pipe(
      HttpClientRequest.setHeader("Authorization", basicAuth(fromUser, fromPassword)),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.setBody(HttpBody.text(JSON.stringify(createEmailRequest), "application/json"))
    )

    yield* httpClient.execute(createReq)
    yield* Console.log(`Test email created: "${subject}"`)
  })

// Main seeding program
const seedProgram = Effect.gen(function* () {
  yield* Console.log("=== Stalwart Test Data Seeding ===\n")

  // Wait for server
  yield* waitForServer

  // Create domain
  yield* createDomain

  // Create users
  for (const user of TEST_CONFIG.users) {
    yield* createUser(user)
  }

  // Create some test emails
  yield* Console.log("\nCreating test emails...")

  yield* sendTestEmail(
    "testuser",
    "testpassword123",
    "alice@test.local",
    "Welcome to JMAP Testing",
    "Hello Alice,\n\nThis is a test email for the effect-jmap library.\n\nBest regards,\nTest User"
  ).pipe(Effect.catchAll((e) => Console.log(`Note: Could not create test email: ${e}`)))

  yield* sendTestEmail(
    "alice",
    "alicepassword123",
    "bob@test.local",
    "Meeting Tomorrow",
    "Hi Bob,\n\nJust a reminder about our meeting tomorrow at 10am.\n\nThanks,\nAlice"
  ).pipe(Effect.catchAll((e) => Console.log(`Note: Could not create test email: ${e}`)))

  yield* Console.log("\n=== Seeding Complete ===")
  yield* Console.log("\nTest accounts created:")
  for (const user of TEST_CONFIG.users) {
    yield* Console.log(`  - ${user.name} (password: ${user.password})`)
    yield* Console.log(`    Emails: ${user.emails.join(", ")}`)
  }

  yield* Console.log(`\nJMAP endpoint: ${TEST_CONFIG.baseUrl}/.well-known/jmap`)
  yield* Console.log(`Admin: ${TEST_CONFIG.adminUsername} / ${TEST_CONFIG.adminPassword}`)
})

// Run the program
const main = seedProgram.pipe(
  Effect.provide(NodeHttpClient.layer),
  Effect.catchAll((error) =>
    Console.error(`Seeding failed: ${error}`)
  )
)

NodeRuntime.runMain(main)
