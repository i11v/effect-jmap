import { Layer } from 'effect'
import { NodeHttpClient } from '@effect/platform-node'
import { JMAPClientLive as JMAPClientLiveImpl, defaultConfig, type JMAPClientConfig } from './client/live.ts'
import { MailboxServiceLive } from './mailbox/service.ts'
import { EmailServiceLive } from './email/service.ts'
import { EmailSubmissionServiceLive } from './submission/service.ts'
import { IdGeneratorLive } from './shared/id-generator.ts'

export * from './client/live.ts'
export * from './client/test.ts'

/**
 * Complete JMAP layer including all services, client, and HTTP client.
 * This is the easiest way to get started with effect-jmap.
 *
 * This layer includes:
 * - HTTP client (NodeHttpClient.layerUndici)
 * - JMAP client with default configuration
 * - All JMAP services (Mailbox, Email, EmailSubmission)
 * - ID generator
 *
 * @param sessionUrl - JMAP session URL (e.g., 'https://api.fastmail.com/jmap/session')
 * @param bearerToken - API token for authentication
 *
 * @example
 * ```typescript
 * import { JMAPLive, MailboxService, EmailService } from 'effect-jmap'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const mailboxService = yield* MailboxService
 *   const mailboxes = yield* mailboxService.getAll(accountId)
 *   // Use services...
 * })
 *
 * const mainLayer = JMAPLive(
 *   'https://api.fastmail.com/jmap/session',
 *   'your-bearer-token'
 * )
 *
 * Effect.runPromise(program.pipe(Effect.provide(mainLayer)))
 * ```
 */
export const JMAPLive = (
  sessionUrl: string,
  bearerToken: string
) => {
  return Layer.provideMerge(
    Layer.mergeAll(
      JMAPClientLiveImpl(defaultConfig(sessionUrl, bearerToken)),
      MailboxServiceLive,
      EmailServiceLive,
      EmailSubmissionServiceLive,
      IdGeneratorLive
    ),
    NodeHttpClient.layer
  )
}

/**
 * Complete JMAP layer with custom configuration.
 *
 * Use this when you need to customize the JMAP client configuration
 * (e.g., timeout, retries, user agent, etc.)
 *
 * @param config - Custom JMAP client configuration
 *
 * @example
 * ```typescript
 * import { JMAPLiveWithConfig, defaultConfig } from 'effect-jmap'
 * import { Effect } from 'effect'
 *
 * const config = {
 *   ...defaultConfig(sessionUrl, bearerToken),
 *   timeout: 60000,
 *   maxRetries: 5,
 *   userAgent: 'my-app/1.0'
 * }
 *
 * const mainLayer = JMAPLiveWithConfig(config)
 *
 * Effect.runPromise(program.pipe(Effect.provide(mainLayer)))
 * ```
 */
export const JMAPLiveWithConfig = (
  config: JMAPClientConfig
) => {
  return Layer.provideMerge(
    Layer.mergeAll(
      JMAPClientLiveImpl(config),
      MailboxServiceLive,
      EmailServiceLive,
      EmailSubmissionServiceLive,
      IdGeneratorLive
    ),
    NodeHttpClient.layer
  )
}