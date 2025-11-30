import { Layer } from "effect"
import { MailboxServiceLive } from "./Mailbox.js"
import { EmailServiceLive } from "./Email.js"
import { EmailSubmissionServiceLive } from "./EmailSubmission.js"
import { IdGeneratorLive } from "./IdGenerator.js"

/**
 * Combined layer providing all JMAP services with their dependencies.
 *
 * This layer merges all service implementations and includes IdGenerator.
 *
 * **Note:** This layer does NOT include the HTTP client or JMAP client layers.
 * You still need to provide:
 * - An HTTP client layer (e.g., `NodeHttpClient.layerUndici`)
 * - JMAP client layer with your credentials
 *
 * **For beginners:** Use the `JMAPLive()` function from 'effect-jmap' instead,
 * which includes everything you need in a single function call.
 *
 * **For advanced users:** Use this layer when you need fine-grained control
 * over the HTTP client or JMAP client configuration.
 *
 * @example Basic usage (advanced)
 * ```typescript
 * import { AppLive, createJMAPClient } from "effect-jmap"
 * import { NodeHttpClient } from '@effect/platform-node'
 * import { Layer } from 'effect'
 *
 * const mainLayer = Layer.mergeAll(
 *   NodeHttpClient.layerUndici,
 *   createJMAPClient(sessionUrl, bearerToken),
 *   AppLive
 * )
 *
 * const program = Effect.gen(function* () {
 *   const mailboxService = yield* MailboxService
 *   // Use the service...
 * })
 *
 * Effect.runPromise(program.pipe(Effect.provide(mainLayer)))
 * ```
 *
 * @example Quick start (recommended)
 * ```typescript
 * import { JMAPLive, MailboxService } from "effect-jmap"
 * import { Effect } from 'effect'
 *
 * // Much simpler - everything included!
 * const mainLayer = JMAPLive(sessionUrl, bearerToken)
 *
 * const program = Effect.gen(function* () {
 *   const mailboxService = yield* MailboxService
 *   // Use the service...
 * })
 *
 * Effect.runPromise(program.pipe(Effect.provide(mainLayer)))
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