import { Layer } from "effect"
import { MailboxServiceLive } from "./Mailbox.js"
import { EmailServiceLive } from "./Email.js"
import { EmailSubmissionServiceLive } from "./EmailSubmission.js"
import { IdGeneratorLive } from "./IdGenerator.js"

/**
 * Combined layer providing all JMAP services with their dependencies.
 *
 * This layer merges all service implementations and includes IdGenerator
 * in the runtime context to satisfy their requirements.
 * Use this as the main layer for your application.
 *
 * @example
 * ```typescript
 * import { AppLive } from "effect-jmap/services"
 *
 * const program = Effect.gen(function* () {
 *   const mailboxService = yield* MailboxService
 *   // Use the service...
 * })
 *
 * const runnable = program.pipe(Effect.provide(AppLive))
 * ```
 */
export const AppLive = Layer.mergeAll(
  MailboxServiceLive,
  EmailServiceLive,
  EmailSubmissionServiceLive,
  IdGeneratorLive
)

// Re-export all services
export * from './Mailbox.js'
export * from './Email.js'
export * from './EmailSubmission.js'
export * from './IdGenerator.js'