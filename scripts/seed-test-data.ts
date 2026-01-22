/**
 * Seed Test Data Script for Stalwart JMAP Server
 *
 * This script initializes the Stalwart test server with:
 * - A test domain
 * - Test user accounts
 * - Sample mailboxes and emails (from generated test data)
 *
 * Usage:
 *   pnpm seed-test-data              # Seed with generated data
 *   pnpm seed-test-data --minimal    # Seed only users, no emails
 */

import { Effect, Console, Schedule, Duration, pipe } from "effect"
import { NodeRuntime } from "@effect/platform-node"
import { HttpClient, HttpClientRequest, HttpBody } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { execSync } from "child_process"
import * as crypto from "crypto"
import * as fs from "fs"
import * as path from "path"

import type { GeneratedEmail, JMAPEmailCreate } from "./lib/email-builder.js"

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
    {
      name: "carol",
      password: "carolpassword123",
      description: "Carol Davis",
      emails: ["carol@test.local"],
    },
    {
      name: "david",
      password: "davidpassword123",
      description: "David Wilson",
      emails: ["david@test.local"],
    },
    {
      name: "eve",
      password: "evepassword123",
      description: "Eve Martinez",
      emails: ["eve@test.local"],
    },
  ],
}

/**
 * Generated test data structure
 */
interface GeneratedTestData {
  version: string
  generatedAt: string
  useAI: boolean
  emails: GeneratedEmail[]
  threads: Record<string, string[]>
  mailboxes: string[]
  personas: Array<{ key: string; email: string; name: string }>
}

/**
 * JMAP Session response
 */
interface JMAPSession {
  primaryAccounts: Record<string, string>
  apiUrl: string
}

/**
 * Mailbox information
 */
interface MailboxInfo {
  id: string
  role: string | null
  name: string
}

// Helper to create Basic auth header
const basicAuth = (username: string, password: string): string => {
  const credentials = Buffer.from(`${username}:${password}`).toString("base64")
  return `Basic ${credentials}`
}

// Helper to hash password using SHA-512 crypt format (for Stalwart)
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("base64").replace(/[+/=]/g, "").slice(0, 16)
  try {
    const hash = execSync(`openssl passwd -6 -salt "${salt}" "${password}"`, { encoding: "utf-8" }).trim()
    return hash
  } catch {
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

    const hashedPassword = hashPassword(user.password)

    yield* managementRequest("POST", "/api/principal", {
      type: "individual",
      name: user.name,
      secrets: [hashedPassword],
      description: user.description,
      emails: user.emails,
      roles: ["user"],
    }).pipe(
      Effect.catchAll((error) => {
        if (String(error).includes("already exists")) {
          return Console.log(`User ${user.name} already exists`)
        }
        return Effect.fail(error)
      })
    )

    yield* Console.log(`User ${user.name} created with email(s): ${user.emails.join(", ")}`)
  })

// Get JMAP session for a user
const getJMAPSession = (username: string, password: string) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient

    const sessionRequest = HttpClientRequest.get(`${TEST_CONFIG.baseUrl}/jmap/session`).pipe(
      HttpClientRequest.setHeader("Authorization", basicAuth(username, password))
    )

    const sessionResponse = yield* httpClient.execute(sessionRequest)
    const sessionText = yield* sessionResponse.text
    const session = JSON.parse(sessionText) as JMAPSession

    const accountId = session.primaryAccounts["urn:ietf:params:jmap:mail"]

    // Fix apiUrl if it contains Docker container hostname
    const baseUrlParsed = new URL(TEST_CONFIG.baseUrl)
    const apiUrlParsed = new URL(session.apiUrl)
    apiUrlParsed.host = baseUrlParsed.host
    apiUrlParsed.protocol = baseUrlParsed.protocol
    const apiUrl = apiUrlParsed.toString()

    return { accountId, apiUrl }
  })

// Make a JMAP request
const jmapRequest = <T>(
  apiUrl: string,
  username: string,
  password: string,
  methodCalls: unknown[]
) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient

    const request = HttpClientRequest.post(apiUrl).pipe(
      HttpClientRequest.setHeader("Authorization", basicAuth(username, password)),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.setBody(
        HttpBody.text(
          JSON.stringify({
            using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
            methodCalls,
          }),
          "application/json"
        )
      )
    )

    const response = yield* httpClient.execute(request)
    const text = yield* response.text

    if (response.status >= 400) {
      yield* Effect.fail(new Error(`JMAP error: HTTP ${response.status}: ${text}`))
    }

    return JSON.parse(text) as T
  })

// Get all mailboxes for an account
const getMailboxes = (apiUrl: string, accountId: string, username: string, password: string) =>
  Effect.gen(function* () {
    const result = yield* jmapRequest<{
      methodResponses: [string, { list?: MailboxInfo[] }, string][]
    }>(apiUrl, username, password, [
      ["Mailbox/get", { accountId, properties: ["id", "role", "name"] }, "0"],
    ])

    const mailboxes = result.methodResponses[0]?.[1]?.list ?? []
    return mailboxes
  })

// Create archive mailbox if it doesn't exist
const ensureArchiveMailbox = (
  apiUrl: string,
  accountId: string,
  username: string,
  password: string,
  mailboxes: MailboxInfo[]
) =>
  Effect.gen(function* () {
    // Check if archive mailbox already exists
    const hasArchive = mailboxes.some((m) => m.role === "archive" || m.name.toLowerCase() === "archive")
    if (hasArchive) {
      return mailboxes
    }

    yield* Console.log(`    Creating archive mailbox for ${username}...`)

    // Create archive mailbox
    const result = yield* jmapRequest<{
      methodResponses: [string, { created?: Record<string, { id: string }> }, string][]
    }>(apiUrl, username, password, [
      [
        "Mailbox/set",
        {
          accountId,
          create: {
            archive: {
              name: "Archive",
              role: "archive",
            },
          },
        },
        "0",
      ],
    ]).pipe(
      Effect.catchAll((error) => {
        Console.log(`    Could not create archive mailbox: ${error}`)
        return Effect.succeed({ methodResponses: [] as never })
      })
    )

    const created = result.methodResponses[0]?.[1]?.created?.archive
    if (created) {
      // Return updated mailbox list
      return [...mailboxes, { id: created.id, role: "archive", name: "Archive" }]
    }

    return mailboxes
  })

// Resolve mailbox placeholder to actual ID
const resolveMailboxId = (
  placeholder: string,
  mailboxes: MailboxInfo[]
): string | null => {
  // Extract role from placeholder (e.g., "MAILBOX_INBOX" -> "inbox")
  const role = placeholder.replace("MAILBOX_", "").toLowerCase()

  // Find mailbox by role
  const mailbox = mailboxes.find((m) => m.role === role)
  if (mailbox) {
    return mailbox.id
  }

  // Fall back to name matching
  const byName = mailboxes.find(
    (m) => m.name.toLowerCase() === role
  )
  return byName?.id ?? null
}

// Seed a batch of emails for a user
const seedEmails = (
  apiUrl: string,
  accountId: string,
  username: string,
  password: string,
  emails: GeneratedEmail[],
  mailboxes: MailboxInfo[]
) =>
  Effect.gen(function* () {
    if (emails.length === 0) {
      return
    }

    yield* Console.log(`  Seeding ${emails.length} emails for ${username}...`)

    // Process emails in batches of 10
    const batchSize = 10
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const createMap: Record<string, JMAPEmailCreate> = {}

      for (const email of batch) {
        // Resolve mailbox IDs
        const resolvedMailboxIds: Record<string, boolean> = {}
        for (const [placeholder, value] of Object.entries(email.create.mailboxIds)) {
          const actualId = resolveMailboxId(placeholder, mailboxes)
          if (actualId) {
            resolvedMailboxIds[actualId] = value
          }
        }

        // Skip if no valid mailbox
        if (Object.keys(resolvedMailboxIds).length === 0) {
          yield* Console.log(`    Skipping email ${email.id}: no valid mailbox`)
          continue
        }

        // Create email object with resolved mailbox IDs
        createMap[email.id] = {
          ...email.create,
          mailboxIds: resolvedMailboxIds,
        }
      }

      if (Object.keys(createMap).length === 0) {
        continue
      }

      // Make JMAP Email/set request
      const result = yield* jmapRequest<{
        methodResponses: [string, { created?: Record<string, unknown>; notCreated?: Record<string, unknown> }, string][]
      }>(apiUrl, username, password, [
        ["Email/set", { accountId, create: createMap }, "0"],
      ]).pipe(
        Effect.tapError((error) => Console.log(`    Batch error: ${error}`)),
        Effect.catchAll(() => Effect.succeed({ methodResponses: [] as never }))
      )

      const setResponse = result.methodResponses[0]?.[1]
      const createdCount = Object.keys(setResponse?.created ?? {}).length
      const errorCount = Object.keys(setResponse?.notCreated ?? {}).length

      if (errorCount > 0) {
        yield* Console.log(`    Batch: ${createdCount} created, ${errorCount} failed`)
      }
    }
  })

// Load generated test data
const loadGeneratedData = Effect.gen(function* () {
  const dataPath = path.join(process.cwd(), "test-data", "generated", "emails.json")

  if (!fs.existsSync(dataPath)) {
    yield* Console.log("No generated test data found. Run 'pnpm generate-test-data' first.")
    return null
  }

  const content = fs.readFileSync(dataPath, "utf-8")
  const data = JSON.parse(content) as GeneratedTestData

  yield* Console.log(`Loaded ${data.emails.length} generated emails from ${data.generatedAt}`)
  return data
})

// Group emails by the user who should own them
// For sent/drafts mailboxes: group by sender (from)
// For other mailboxes: group by recipient (to)
const groupEmailsByOwner = (emails: GeneratedEmail[]): Map<string, GeneratedEmail[]> => {
  const groups = new Map<string, GeneratedEmail[]>()

  for (const email of emails) {
    const mailboxPlaceholder = Object.keys(email.create.mailboxIds)[0] ?? ""
    const isSenderMailbox =
      mailboxPlaceholder.includes("SENT") || mailboxPlaceholder.includes("DRAFTS")

    let username: string | undefined

    if (isSenderMailbox) {
      // For sent/drafts, use the sender's account
      const fromAddresses = email.create.from ?? []
      if (fromAddresses.length > 0) {
        username = fromAddresses[0]!.email.split("@")[0]
      }
    } else {
      // For inbox/other, use the recipient's account
      const toAddresses = email.create.to ?? []
      if (toAddresses.length > 0) {
        username = toAddresses[0]!.email.split("@")[0]
      }
    }

    if (!username) continue

    const existing = groups.get(username) ?? []
    existing.push(email)
    groups.set(username, existing)
  }

  return groups
}

// Main seeding program
const seedProgram = Effect.gen(function* () {
  const args = process.argv.slice(2)
  const minimalMode = args.includes("--minimal")

  yield* Console.log("=== Stalwart Test Data Seeding ===\n")

  // Wait for server
  yield* waitForServer

  // Create domain
  yield* createDomain

  // Create users
  for (const user of TEST_CONFIG.users) {
    yield* createUser(user)
  }

  if (minimalMode) {
    yield* Console.log("\nMinimal mode: Skipping email seeding")
  } else {
    // Load generated data
    const generatedData = yield* loadGeneratedData

    if (generatedData && generatedData.emails.length > 0) {
      yield* Console.log("\nSeeding generated test emails...")

      // Group emails by owner (sender for sent/drafts, recipient for others)
      const emailsByUser = groupEmailsByOwner(generatedData.emails)

      // Seed emails for each user
      for (const user of TEST_CONFIG.users) {
        const userEmails = emailsByUser.get(user.name) ?? []

        if (userEmails.length === 0) {
          continue
        }

        try {
          // Get JMAP session for user
          const { accountId, apiUrl } = yield* getJMAPSession(user.name, user.password)

          // Get mailboxes
          let mailboxes = yield* getMailboxes(apiUrl, accountId, user.name, user.password)

          // Ensure archive mailbox exists
          mailboxes = yield* ensureArchiveMailbox(apiUrl, accountId, user.name, user.password, mailboxes)

          // Seed emails
          yield* seedEmails(apiUrl, accountId, user.name, user.password, userEmails, mailboxes)
        } catch (error) {
          yield* Console.log(`  Error seeding emails for ${user.name}: ${error}`)
        }
      }
    } else {
      // Fallback to basic test emails if no generated data
      yield* Console.log("\nCreating basic test emails...")

      yield* seedBasicTestEmails()
    }
  }

  yield* Console.log("\n=== Seeding Complete ===")
  yield* Console.log("\nTest accounts created:")
  for (const user of TEST_CONFIG.users) {
    yield* Console.log(`  - ${user.name} (password: ${user.password})`)
    yield* Console.log(`    Emails: ${user.emails.join(", ")}`)
  }

  yield* Console.log(`\nJMAP endpoint: ${TEST_CONFIG.baseUrl}/.well-known/jmap`)
  yield* Console.log(`Admin: ${TEST_CONFIG.adminUsername} / ${TEST_CONFIG.adminPassword}`)
})

// Basic test email seeding (fallback)
const seedBasicTestEmails = Effect.gen(function* () {
  const { accountId, apiUrl } = yield* getJMAPSession("testuser", "testpassword123")
  const mailboxes = yield* getMailboxes(apiUrl, accountId, "testuser", "testpassword123")

  const draftsMailbox = mailboxes.find((m) => m.role === "drafts")
  if (!draftsMailbox) {
    yield* Console.log("Drafts mailbox not found, skipping basic emails")
    return
  }

  yield* jmapRequest(apiUrl, "testuser", "testpassword123", [
    [
      "Email/set",
      {
        accountId,
        create: {
          basic1: {
            mailboxIds: { [draftsMailbox.id]: true },
            from: [{ email: "testuser@test.local" }],
            to: [{ email: "alice@test.local" }],
            subject: "Welcome to JMAP Testing",
            bodyStructure: { type: "text/plain", partId: "1" },
            bodyValues: {
              "1": {
                value: "Hello Alice,\n\nThis is a test email for the effect-jmap library.\n\nBest regards,\nTest User",
                isEncodingProblem: false,
                isTruncated: false,
              },
            },
          },
        },
      },
      "0",
    ],
  ]).pipe(Effect.catchAll((e) => Console.log(`Note: Could not create test email: ${e}`)))

  yield* Console.log("Basic test emails created")
})

// Run the program
const main = seedProgram.pipe(
  Effect.provide(NodeHttpClient.layer),
  Effect.catchAll((error) =>
    Console.error(`Seeding failed: ${error}`)
  )
)

NodeRuntime.runMain(main)
