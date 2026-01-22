/**
 * Scenario Parser - YAML parsing with Effect Schema validation
 *
 * Parses declarative email scenario definitions into structured objects
 * for the test data generator.
 */

import { Schema, Effect, Either } from "effect"
import * as YAML from "yaml"
import * as fs from "fs"
import * as path from "path"

/**
 * Persona definition - represents a test user
 */
export const PersonaSchema = Schema.Struct({
  email: Schema.String,
  name: Schema.String,
})

export type Persona = Schema.Schema.Type<typeof PersonaSchema>

/**
 * Attachment specification
 */
export const AttachmentSpecSchema = Schema.Struct({
  type: Schema.String,
  name: Schema.String,
  size: Schema.String, // e.g., "500KB", "2MB"
})

export type AttachmentSpec = Schema.Schema.Type<typeof AttachmentSpecSchema>

/**
 * Email specification within a thread scenario
 */
export const ThreadEmailSchema = Schema.Struct({
  from: Schema.String, // persona key
  to: Schema.optional(Schema.Array(Schema.String)), // persona keys
  reply_to: Schema.optional(Schema.Number), // index of email being replied to
  mailbox: Schema.String,
  keywords: Schema.optional(Schema.Array(Schema.String)),
  cc: Schema.optional(Schema.Array(Schema.String)),
  bcc: Schema.optional(Schema.Array(Schema.String)),
})

export type ThreadEmail = Schema.Schema.Type<typeof ThreadEmailSchema>

/**
 * Body type specification
 */
export const BodyTypeSchema = Schema.optional(
  Schema.Union(
    Schema.Literal("text/plain"),
    Schema.Literal("text/html"),
    Schema.Literal("multipart/alternative"),
    Schema.Literal("multipart/mixed")
  )
)

export type BodyType = Schema.Schema.Type<typeof BodyTypeSchema>

/**
 * Tone specification for AI content generation
 */
export const ToneSchema = Schema.optional(
  Schema.Union(
    Schema.Literal("professional"),
    Schema.Literal("casual"),
    Schema.Literal("formal"),
    Schema.Literal("friendly"),
    Schema.Literal("urgent")
  )
)

export type Tone = Schema.Schema.Type<typeof ToneSchema>

/**
 * Thread scenario - a conversation with multiple emails
 */
export const ThreadScenarioSchema = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("thread"),
  topic: Schema.String,
  tone: ToneSchema,
  participants: Schema.Array(Schema.String), // persona keys
  emails: Schema.Array(ThreadEmailSchema),
})

export type ThreadScenario = Schema.Schema.Type<typeof ThreadScenarioSchema>

/**
 * Single email scenario - standalone email
 */
export const SingleScenarioSchema = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("single"),
  topic: Schema.String,
  tone: ToneSchema,
  from: Schema.String, // persona key
  to: Schema.Array(Schema.String), // persona keys
  mailbox: Schema.String,
  keywords: Schema.optional(Schema.Array(Schema.String)),
  attachments: Schema.optional(Schema.Array(AttachmentSpecSchema)),
  body_type: BodyTypeSchema,
  cc: Schema.optional(Schema.Array(Schema.String)),
  bcc: Schema.optional(Schema.Array(Schema.String)),
  // Edge case fields
  subject_override: Schema.optional(Schema.String), // For testing specific subjects like emojis
  body_override: Schema.optional(Schema.String), // For testing specific body content
  empty_body: Schema.optional(Schema.Boolean), // For edge case testing
  inline_images: Schema.optional(Schema.Number), // Number of inline images
})

export type SingleScenario = Schema.Schema.Type<typeof SingleScenarioSchema>

/**
 * Union of all scenario types
 */
export const ScenarioSchema = Schema.Union(
  ThreadScenarioSchema,
  SingleScenarioSchema
)

export type Scenario = Schema.Schema.Type<typeof ScenarioSchema>

/**
 * Full scenarios configuration file
 */
export const ScenariosConfigSchema = Schema.Struct({
  personas: Schema.Record({ key: Schema.String, value: PersonaSchema }),
  scenarios: Schema.Array(ScenarioSchema),
})

export type ScenariosConfig = Schema.Schema.Type<typeof ScenariosConfigSchema>

/**
 * Parse size string to bytes
 * @param size - Size string like "500KB", "2MB", "1GB"
 * @returns Number of bytes
 */
export const parseSizeToBytes = (size: string): number => {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i)
  if (!match) {
    throw new Error(`Invalid size format: ${size}`)
  }

  const value = parseFloat(match[1] ?? "0")
  const unit = (match[2] ?? "B").toUpperCase()

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  }

  return Math.floor(value * (multipliers[unit] ?? 1))
}

/**
 * Resolved persona with full details
 */
export interface ResolvedPersona {
  key: string
  email: string
  name: string
}

/**
 * Resolved email within a thread
 */
export interface ResolvedThreadEmail {
  from: ResolvedPersona
  to: ResolvedPersona[]
  cc: ResolvedPersona[]
  bcc: ResolvedPersona[]
  replyToIndex?: number
  mailbox: string
  keywords: string[]
}

/**
 * Resolved thread scenario
 */
export interface ResolvedThreadScenario {
  id: string
  type: "thread"
  topic: string
  tone: string
  participants: ResolvedPersona[]
  emails: ResolvedThreadEmail[]
}

/**
 * Resolved attachment spec
 */
export interface ResolvedAttachment {
  type: string
  name: string
  sizeBytes: number
}

/**
 * Resolved single email scenario
 */
export interface ResolvedSingleScenario {
  id: string
  type: "single"
  topic: string
  tone: string
  from: ResolvedPersona
  to: ResolvedPersona[]
  cc: ResolvedPersona[]
  bcc: ResolvedPersona[]
  mailbox: string
  keywords: string[]
  attachments: ResolvedAttachment[]
  bodyType: string
  subjectOverride?: string
  bodyOverride?: string
  emptyBody: boolean
  inlineImages: number
}

export type ResolvedScenario = ResolvedThreadScenario | ResolvedSingleScenario

/**
 * Resolved scenarios configuration
 */
export interface ResolvedConfig {
  personas: Map<string, ResolvedPersona>
  scenarios: ResolvedScenario[]
}

/**
 * Parse and validate scenarios YAML file
 */
export const parseScenarios = (
  yamlContent: string
): Effect.Effect<ScenariosConfig, Error> =>
  Effect.gen(function* () {
    const parsed = YAML.parse(yamlContent)
    const decoded = Schema.decodeEither(ScenariosConfigSchema)(parsed)

    if (Either.isLeft(decoded)) {
      const error = decoded.left
      return yield* Effect.fail(
        new Error(`Schema validation failed: ${String(error)}`)
      )
    }

    return decoded.right
  })

/**
 * Load scenarios from a YAML file path
 */
export const loadScenarios = (
  filePath: string
): Effect.Effect<ScenariosConfig, Error> =>
  Effect.gen(function* () {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath)

    const content = yield* Effect.try({
      try: () => fs.readFileSync(absolutePath, "utf-8"),
      catch: (error) =>
        new Error(`Failed to read scenarios file: ${absolutePath} - ${error}`),
    })

    return yield* parseScenarios(content)
  })

/**
 * Resolve persona references to full persona objects
 */
const resolvePersona = (
  key: string,
  personas: Record<string, Persona>
): ResolvedPersona => {
  const persona = personas[key]
  if (!persona) {
    throw new Error(`Unknown persona: ${key}`)
  }
  return { key, email: persona.email, name: persona.name }
}

/**
 * Resolve persona references in a list
 */
const resolvePersonas = (
  keys: string[] | undefined,
  personas: Record<string, Persona>
): ResolvedPersona[] => {
  if (!keys) return []
  return keys.map((key) => resolvePersona(key, personas))
}

/**
 * Resolve scenarios config with all persona references resolved
 */
export const resolveConfig = (config: ScenariosConfig): ResolvedConfig => {
  const personasMap = new Map<string, ResolvedPersona>()

  // Build personas map
  for (const [key, persona] of Object.entries(config.personas)) {
    personasMap.set(key, { key, email: persona.email, name: persona.name })
  }

  // Resolve scenarios
  const scenarios: ResolvedScenario[] = config.scenarios.map((scenario) => {
    if (scenario.type === "thread") {
      const threadScenario = scenario as ThreadScenario
      return {
        id: threadScenario.id,
        type: "thread" as const,
        topic: threadScenario.topic,
        tone: threadScenario.tone ?? "professional",
        participants: resolvePersonas(
          threadScenario.participants,
          config.personas
        ),
        emails: threadScenario.emails.map((email) => ({
          from: resolvePersona(email.from, config.personas),
          to: resolvePersonas(email.to, config.personas),
          cc: resolvePersonas(email.cc, config.personas),
          bcc: resolvePersonas(email.bcc, config.personas),
          replyToIndex: email.reply_to,
          mailbox: email.mailbox,
          keywords: email.keywords ?? [],
        })),
      }
    } else {
      const singleScenario = scenario as SingleScenario
      return {
        id: singleScenario.id,
        type: "single" as const,
        topic: singleScenario.topic,
        tone: singleScenario.tone ?? "professional",
        from: resolvePersona(singleScenario.from, config.personas),
        to: resolvePersonas(singleScenario.to, config.personas),
        cc: resolvePersonas(singleScenario.cc, config.personas),
        bcc: resolvePersonas(singleScenario.bcc, config.personas),
        mailbox: singleScenario.mailbox,
        keywords: singleScenario.keywords ?? [],
        attachments: (singleScenario.attachments ?? []).map((att) => ({
          type: att.type,
          name: att.name,
          sizeBytes: parseSizeToBytes(att.size),
        })),
        bodyType: singleScenario.body_type ?? "text/plain",
        subjectOverride: singleScenario.subject_override,
        bodyOverride: singleScenario.body_override,
        emptyBody: singleScenario.empty_body ?? false,
        inlineImages: singleScenario.inline_images ?? 0,
      }
    }
  })

  return { personas: personasMap, scenarios }
}
