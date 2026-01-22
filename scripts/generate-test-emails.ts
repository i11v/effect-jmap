#!/usr/bin/env tsx
/**
 * Test Email Dataset Generator
 *
 * Generates comprehensive test email data for JMAP RFC 8621 functional testing.
 * Reads scenario definitions from YAML and produces JSON output or seeds directly
 * to a JMAP server.
 *
 * Usage:
 *   pnpm generate-test-data                    # Generate with AI
 *   pnpm generate-test-data --no-ai            # Generate with fallback content
 *   pnpm generate-test-data --dry-run          # Preview without generating
 */

import { Effect, Console } from "effect"
import { NodeRuntime } from "@effect/platform-node"
import * as fs from "fs"
import * as path from "path"

import {
  loadScenarios,
  resolveConfig,
  type ResolvedConfig,
  type ResolvedThreadScenario,
  type ResolvedSingleScenario,
} from "./lib/scenario-parser.js"
import {
  buildThreadContext,
  buildSingleEmailContext,
  generateBlobId,
} from "./lib/thread-builder.js"
import {
  generateContentWithFallback,
  generateFallbackContent,
  type EmailGenerationParams,
  type GeneratedContent,
} from "./lib/ai-generator.js"
import {
  buildEmail,
  buildAttachmentMetadata,
  buildInlineImageAttachments,
  type GeneratedEmail,
} from "./lib/email-builder.js"
import {
  generateBlob,
  writeBlobsToDir,
  type GeneratedBlob,
} from "./lib/attachment-generator.js"

/**
 * Output structure for generated test data
 */
interface GeneratedTestData {
  version: string
  generatedAt: string
  useAI: boolean
  emails: GeneratedEmail[]
  threads: Record<string, string[]> // threadId -> emailIds
  mailboxes: string[]
  personas: Array<{ key: string; email: string; name: string }>
}

/**
 * Mailbox role to placeholder ID mapping
 * These will be replaced with actual IDs during seeding
 */
const MAILBOX_PLACEHOLDERS: Record<string, string> = {
  inbox: "MAILBOX_INBOX",
  drafts: "MAILBOX_DRAFTS",
  sent: "MAILBOX_SENT",
  trash: "MAILBOX_TRASH",
  archive: "MAILBOX_ARCHIVE",
  junk: "MAILBOX_JUNK",
}

/**
 * Get mailbox placeholder ID
 */
const getMailboxId = (mailbox: string): string => {
  return MAILBOX_PLACEHOLDERS[mailbox] ?? `MAILBOX_${mailbox.toUpperCase()}`
}

/**
 * Generate date offsets for test data variety
 */
const generateReceivedDate = (scenarioId: string, emailIndex: number): Date => {
  const baseDate = new Date()

  // Use scenario ID to deterministically assign dates
  if (scenarioId.includes("old") || scenarioId.includes("archive")) {
    // Old emails: 30-60 days ago
    const daysAgo = 30 + (emailIndex * 5)
    baseDate.setDate(baseDate.getDate() - daysAgo)
  } else if (scenarioId.includes("recent")) {
    // Recent emails: 1-7 days ago
    const daysAgo = 1 + emailIndex
    baseDate.setDate(baseDate.getDate() - daysAgo)
  } else {
    // Normal emails: spread over last 14 days
    const daysAgo = emailIndex % 14
    baseDate.setDate(baseDate.getDate() - daysAgo)
    // Add some hour variation
    baseDate.setHours(9 + (emailIndex * 2) % 12)
  }

  return baseDate
}

/**
 * Process a thread scenario
 */
const processThreadScenario = (
  scenario: ResolvedThreadScenario,
  useAI: boolean
): Effect.Effect<GeneratedEmail[], Error> =>
  Effect.gen(function* () {
    yield* Console.log(`  Processing thread: ${scenario.id}`)

    const emailCount = scenario.emails.length
    const replyToIndices = scenario.emails.map((e) => e.replyToIndex)
    const threadingContexts = buildThreadContext(scenario.id, emailCount, replyToIndices)

    const emails: GeneratedEmail[] = []
    const previousContents: GeneratedContent[] = []
    const previousEmails: typeof scenario.emails = []

    for (let i = 0; i < emailCount; i++) {
      const email = scenario.emails[i]!
      const threading = threadingContexts[i]!

      // Determine recipients: if not specified, derive from thread context
      let recipients = email.to
      if (recipients.length === 0) {
        if (email.replyToIndex !== undefined && previousEmails[email.replyToIndex]) {
          // Reply: send to the original sender
          const replyToEmail = previousEmails[email.replyToIndex]!
          recipients = [replyToEmail.from]
        } else {
          // First email or no reply target: send to all other participants
          recipients = scenario.participants.filter((p) => p.key !== email.from.key)
        }
      }

      // Generate content
      const params: EmailGenerationParams = {
        topic: scenario.topic,
        tone: scenario.tone,
        from: email.from,
        to: recipients,
        cc: email.cc,
        isReply: email.replyToIndex !== undefined,
        replyContext:
          email.replyToIndex !== undefined
            ? previousContents[email.replyToIndex]?.subject
            : undefined,
      }

      const content = yield* generateContentWithFallback(params, useAI)

      // Add Re: prefix for replies if not present
      if (
        email.replyToIndex !== undefined &&
        !content.subject.toLowerCase().startsWith("re:")
      ) {
        const originalSubject =
          previousContents[email.replyToIndex]?.subject ?? scenario.topic
        content.subject = `Re: ${originalSubject}`
      }

      previousContents.push(content)
      previousEmails.push({ ...email, to: recipients })

      // Build the email
      const generatedEmail = buildEmail({
        scenarioId: scenario.id,
        emailIndex: i,
        content,
        threading,
        from: email.from,
        to: recipients,
        cc: email.cc,
        bcc: email.bcc,
        mailboxId: getMailboxId(email.mailbox),
        keywords: email.keywords,
        bodyType: "multipart/alternative",
        attachments: [],
        receivedAt: generateReceivedDate(scenario.id, i),
      })

      emails.push(generatedEmail)
    }

    return emails
  })

/**
 * Process a single email scenario
 */
const processSingleScenario = (
  scenario: ResolvedSingleScenario,
  useAI: boolean
): Effect.Effect<{ email: GeneratedEmail; blobs: GeneratedBlob[] }, Error> =>
  Effect.gen(function* () {
    yield* Console.log(`  Processing single: ${scenario.id}`)

    const threading = buildSingleEmailContext(scenario.id)

    // Build attachments
    let attachments = buildAttachmentMetadata(
      scenario.id,
      0,
      scenario.attachments
    )

    // Add inline images if specified
    if (scenario.inlineImages > 0) {
      const inlineAttachments = buildInlineImageAttachments(
        scenario.id,
        0,
        scenario.inlineImages
      )
      attachments = [...attachments, ...inlineAttachments]
    }

    // Generate content
    const params: EmailGenerationParams = {
      topic: scenario.topic,
      tone: scenario.tone,
      from: scenario.from,
      to: scenario.to,
      cc: scenario.cc,
      hasAttachments: attachments.length > 0,
      attachmentNames: scenario.attachments.map((a) => a.name),
      isEmpty: scenario.emptyBody,
      subjectOverride: scenario.subjectOverride,
      bodyOverride: scenario.bodyOverride,
      inlineImageCount: scenario.inlineImages,
    }

    const content = yield* generateContentWithFallback(params, useAI)

    // Build the email
    const email = buildEmail({
      scenarioId: scenario.id,
      emailIndex: 0,
      content,
      threading,
      from: scenario.from,
      to: scenario.to,
      cc: scenario.cc,
      bcc: scenario.bcc,
      mailboxId: getMailboxId(scenario.mailbox),
      keywords: scenario.keywords,
      bodyType: scenario.bodyType,
      attachments,
      receivedAt: generateReceivedDate(scenario.id, 0),
    })

    // Generate blob data for attachments
    const blobs: GeneratedBlob[] = attachments.map((att) =>
      generateBlob(att.blobId, att.type, att.name, att.size)
    )

    return { email, blobs }
  })

/**
 * Main generation program
 */
const generateProgram = (useAI: boolean, dryRun: boolean) =>
  Effect.gen(function* () {
    yield* Console.log("=== Test Email Dataset Generator ===\n")
    yield* Console.log(`Mode: ${useAI ? "AI Generation" : "Fallback Content"}`)
    if (dryRun) {
      yield* Console.log("DRY RUN - No files will be written\n")
    }

    // Load scenarios
    yield* Console.log("\nLoading scenarios...")
    const scenariosPath = path.join(process.cwd(), "scripts", "scenarios.yaml")
    const rawConfig = yield* loadScenarios(scenariosPath)
    const config = resolveConfig(rawConfig)

    yield* Console.log(`Loaded ${config.scenarios.length} scenarios`)
    yield* Console.log(`Personas: ${config.personas.size}`)

    if (dryRun) {
      yield* Console.log("\nScenarios to process:")
      for (const scenario of config.scenarios) {
        const type = scenario.type === "thread" ? "Thread" : "Single"
        const count =
          scenario.type === "thread" ? scenario.emails.length : 1
        yield* Console.log(`  - ${scenario.id} (${type}, ${count} email(s))`)
      }
      yield* Console.log("\nDry run complete.")
      return
    }

    // Process scenarios
    yield* Console.log("\nGenerating emails...")
    const allEmails: GeneratedEmail[] = []
    const allBlobs: GeneratedBlob[] = []
    const threads: Record<string, string[]> = {}
    const mailboxes = new Set<string>()

    for (const scenario of config.scenarios) {
      if (scenario.type === "thread") {
        const emails = yield* processThreadScenario(scenario, useAI)
        allEmails.push(...emails)

        // Track thread
        const threadId = emails[0]?.threadId
        if (threadId) {
          threads[threadId] = emails.map((e) => e.id)
        }

        // Track mailboxes
        for (const email of scenario.emails) {
          mailboxes.add(email.mailbox)
        }
      } else {
        const { email, blobs } = yield* processSingleScenario(scenario, useAI)
        allEmails.push(email)
        allBlobs.push(...blobs)

        // Track thread (single email = single thread)
        threads[email.threadId] = [email.id]

        // Track mailbox
        mailboxes.add(scenario.mailbox)
      }
    }

    yield* Console.log(`\nGenerated ${allEmails.length} emails`)
    yield* Console.log(`Generated ${allBlobs.length} attachment blobs`)
    yield* Console.log(`Threads: ${Object.keys(threads).length}`)
    yield* Console.log(`Mailboxes: ${Array.from(mailboxes).join(", ")}`)

    // Build output data
    const outputData: GeneratedTestData = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      useAI,
      emails: allEmails,
      threads,
      mailboxes: Array.from(mailboxes),
      personas: Array.from(config.personas.values()),
    }

    // Write output files
    const outputDir = path.join(process.cwd(), "test-data", "generated")
    const blobsDir = path.join(outputDir, "blobs")

    yield* Console.log(`\nWriting output to ${outputDir}...`)

    // Ensure directories exist
    yield* Effect.sync(() => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
    })

    // Write emails.json
    const emailsPath = path.join(outputDir, "emails.json")
    yield* Effect.sync(() => {
      fs.writeFileSync(emailsPath, JSON.stringify(outputData, null, 2))
    })
    yield* Console.log(`  - ${emailsPath}`)

    // Write blobs
    if (allBlobs.length > 0) {
      yield* Effect.promise(() => writeBlobsToDir(allBlobs, blobsDir))
      yield* Console.log(`  - ${blobsDir}/ (${allBlobs.length} files)`)
    }

    yield* Console.log("\n=== Generation Complete ===")
  })

// Parse command line arguments
const args = process.argv.slice(2)
const useAI = !args.includes("--no-ai")
const dryRun = args.includes("--dry-run")

// Run the program
const main = generateProgram(useAI, dryRun).pipe(
  Effect.catchAll((error) =>
    Console.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
  )
)

NodeRuntime.runMain(main)
