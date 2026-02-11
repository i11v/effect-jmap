import { Effect, ManagedRuntime } from 'effect'
import { JMAPClientService, type JMAPClientConfig } from './client.ts'
import type { Session, Response, Invocation } from './types.ts'
import { MailboxService } from '../mailbox/service.ts'
import { EmailService } from '../email/service.ts'
import { EmailSubmissionService } from '../submission/service.ts'
import { JMAPLive, JMAPLiveWithConfig } from '../layers.ts'
import type { Id } from '../shared/common.ts'
import type {
  Envelope,
  EmailSubmissionSetResult as SingleSubmissionResult,
  EmailSubmissionObject,
} from '../submission/schema.ts'
import type { JMAPDate } from '../shared/common.ts'
import type * as Schema from 'effect/Schema'
import type {
  MailboxGetArguments,
  MailboxGetResponse,
  MailboxSetArguments,
  MailboxSetResponse,
  MailboxQueryArguments,
  MailboxQueryResponse,
  MailboxQueryChangesArguments,
  MailboxQueryChangesResponse,
  MailboxMutable,
  MailboxCreated,
  Mailbox as MailboxSchema,
} from '../mailbox/schema.ts'
import type { MailboxRole } from '../mailbox/schema.ts'
import type {
  EmailGetArguments,
  EmailGetResponse,
  EmailSetArguments,
  EmailSetResponse,
  EmailQueryArguments,
  EmailQueryResponse,
  EmailQueryChangesArguments,
  EmailQueryChangesResponse,
  EmailCopyArguments,
  EmailCopyResponse,
  EmailImportArguments,
  EmailImportResponse,
  Email as EmailSchema,
} from '../email/schema.ts'
import type {
  EmailSubmissionGetArguments,
  EmailSubmissionGetResponse,
  EmailSubmissionSetArguments,
  EmailSubmissionSetResponse,
  EmailSubmissionQueryArguments,
  EmailSubmissionQueryResponse,
  EmailSubmissionQueryChangesArguments,
  EmailSubmissionQueryChangesResponse,
  EmailSubmissionChangesArguments,
  EmailSubmissionChangesResponse,
} from '../submission/schema.ts'

// Infer the actual TypeScript types from Schema types
type Mailbox = Schema.Schema.Type<typeof MailboxSchema>
type Email = Schema.Schema.Type<typeof EmailSchema>
type MailboxGetResult = Schema.Schema.Type<typeof MailboxGetResponse>
type MailboxSetResult = Schema.Schema.Type<typeof MailboxSetResponse>
type MailboxQueryResult = Schema.Schema.Type<typeof MailboxQueryResponse>
type MailboxQueryChangesResult = Schema.Schema.Type<typeof MailboxQueryChangesResponse>
type EmailGetResult = Schema.Schema.Type<typeof EmailGetResponse>
type EmailSetResult = Schema.Schema.Type<typeof EmailSetResponse>
type EmailQueryResult = Schema.Schema.Type<typeof EmailQueryResponse>
type EmailQueryChangesResult = Schema.Schema.Type<typeof EmailQueryChangesResponse>
type EmailSubmissionGetResult = Schema.Schema.Type<typeof EmailSubmissionGetResponse>
type EmailSubmissionSetResponseResult = Schema.Schema.Type<typeof EmailSubmissionSetResponse>
type EmailSubmissionQueryResult = Schema.Schema.Type<typeof EmailSubmissionQueryResponse>
type EmailSubmissionQueryChangesResult = Schema.Schema.Type<typeof EmailSubmissionQueryChangesResponse>
type EmailSubmissionChangesResult = Schema.Schema.Type<typeof EmailSubmissionChangesResponse>

/**
 * Promise-based Mailbox namespace.
 *
 * All methods that originally require `accountId` as their first parameter
 * accept an optional `accountId` override — defaulting to the client's
 * auto-discovered primary account ID.
 */
export interface MailboxNamespace {
  readonly get: (args: MailboxGetArguments) => Promise<MailboxGetResult>
  readonly set: (args: MailboxSetArguments) => Promise<MailboxSetResult>
  readonly query: (args: MailboxQueryArguments) => Promise<MailboxQueryResult>
  readonly queryChanges: (args: MailboxQueryChangesArguments) => Promise<MailboxQueryChangesResult>
  readonly getAll: (accountId?: string) => Promise<readonly Mailbox[]>
  readonly findByRole: (role: MailboxRole | null, accountId?: string) => Promise<readonly Mailbox[]>
  readonly getHierarchy: (parentId?: Id, accountId?: string) => Promise<readonly Mailbox[]>
  readonly create: (mailbox: MailboxMutable & { name: string }, accountId?: string) => Promise<Mailbox>
  readonly update: (mailboxId: Id, updates: Partial<MailboxMutable>, accountId?: string) => Promise<MailboxCreated | null>
  readonly destroy: (mailboxIds: Id[], accountId?: string) => Promise<readonly Id[]>
}

/**
 * Promise-based Email namespace.
 *
 * Core JMAP methods (get/set/query/queryChanges/copy/import) accept their
 * full argument objects which already contain accountId.
 *
 * Convenience methods accept an optional `accountId` override.
 */
export interface EmailNamespace {
  readonly get: (args: EmailGetArguments) => Promise<EmailGetResult>
  readonly set: (args: EmailSetArguments) => Promise<EmailSetResult>
  readonly query: (args: EmailQueryArguments) => Promise<EmailQueryResult>
  readonly queryChanges: (args: EmailQueryChangesArguments) => Promise<EmailQueryChangesResult>
  readonly copy: (args: EmailCopyArguments) => Promise<EmailCopyResponse>
  readonly import: (args: EmailImportArguments) => Promise<EmailImportResponse>
  readonly getByMailbox: (
    mailboxId: Id,
    options?: { limit?: number; properties?: string[]; sort?: Array<{ property: string; isAscending?: boolean }> },
    accountId?: string,
  ) => Promise<readonly Email[]>
  readonly search: (
    searchQuery: string,
    options?: { limit?: number; mailboxId?: Id; properties?: string[] },
    accountId?: string,
  ) => Promise<readonly Email[]>
  readonly getUnread: (mailboxId?: Id, limit?: number, accountId?: string) => Promise<readonly Email[]>
  readonly markRead: (emailIds: Id[], read: boolean, accountId?: string) => Promise<readonly Email[]>
  readonly flag: (emailIds: Id[], flagged: boolean, accountId?: string) => Promise<readonly Email[]>
  readonly move: (emailIds: Id[], fromMailboxId: Id, toMailboxId: Id, accountId?: string) => Promise<readonly Email[]>
  readonly updateKeywords: (
    emailIds: Id[],
    keywordsToAdd: string[],
    keywordsToRemove: string[],
    accountId?: string,
  ) => Promise<readonly Email[]>
  readonly getWithContent: (emailIds: Id[], maxBodyValueBytes?: number, accountId?: string) => Promise<readonly Email[]>
  readonly getEmailContent: (emailId: Id, maxBodyValueBytes?: number, accountId?: string) => Promise<Email | null>
  readonly destroy: (emailIds: Id[], accountId?: string) => Promise<readonly Id[]>
}

/**
 * Promise-based EmailSubmission namespace.
 *
 * Core JMAP methods accept their full argument objects.
 * Convenience methods accept an optional `accountId` override.
 */
export interface SubmissionNamespace {
  readonly get: (args: EmailSubmissionGetArguments) => Promise<EmailSubmissionGetResult>
  readonly set: (args: EmailSubmissionSetArguments) => Promise<EmailSubmissionSetResponseResult>
  readonly query: (args: EmailSubmissionQueryArguments) => Promise<EmailSubmissionQueryResult>
  readonly queryChanges: (args: EmailSubmissionQueryChangesArguments) => Promise<EmailSubmissionQueryChangesResult>
  readonly changes: (args: EmailSubmissionChangesArguments) => Promise<EmailSubmissionChangesResult>
  readonly send: (
    identityId: Id,
    emailId: Id,
    options?: {
      envelope?: Envelope | null;
      sendAt?: JMAPDate;
      onSuccessUpdateEmail?: Record<string, any> | null;
      onSuccessDestroyEmail?: Id[] | boolean | null;
    },
    accountId?: string,
  ) => Promise<SingleSubmissionResult>
  readonly getDeliveryStatus: (submissionId: Id, accountId?: string) => Promise<EmailSubmissionObject | undefined>
  readonly cancelScheduled: (submissionId: Id, accountId?: string) => Promise<SingleSubmissionResult | undefined>
  readonly getByEmailId: (emailId: Id, accountId?: string) => Promise<readonly EmailSubmissionObject[]>
  readonly getRecent: (limit?: number, accountId?: string) => Promise<readonly EmailSubmissionObject[]>
}

/**
 * Promise-based JMAP client that hides Effect internals.
 *
 * Created via {@link createJMAPClient} or {@link createJMAPClientWithConfig}.
 *
 * @example
 * ```typescript
 * import { createJMAPClient } from 'effect-jmap'
 *
 * const client = await createJMAPClient(
 *   'https://api.fastmail.com/jmap/session',
 *   'your-bearer-token'
 * )
 *
 * // All methods return Promises — no Effect knowledge needed
 * const mailboxes = await client.mailbox.getAll()
 * const emails = await client.email.query({ accountId: client.accountId, filter: { inMailbox: 'inbox-id' } })
 *
 * // Errors are the same TaggedError types from effect-jmap
 * try {
 *   await client.email.get({ accountId: client.accountId, ids: ['bad-id'] })
 * } catch (e) {
 *   if (e instanceof NetworkError) { ... }
 *   if (e instanceof AuthenticationError) { ... }
 * }
 *
 * // Clean up when done
 * await client.dispose()
 * ```
 */
export interface JMAPClientWrapper {
  /** The auto-discovered primary account ID for mail */
  readonly accountId: string
  /** The raw JMAP session data */
  readonly session: Session
  /** Low-level JMAP batch API */
  readonly batch: (methodCalls: ReadonlyArray<Invocation>, using?: ReadonlyArray<string>) => Promise<Response>
  /** Mailbox operations */
  readonly mailbox: MailboxNamespace
  /** Email operations */
  readonly email: EmailNamespace
  /** Email submission (sending) operations */
  readonly submission: SubmissionNamespace
  /** Dispose the underlying runtime and release resources */
  readonly dispose: () => Promise<void>
}

/**
 * Create a Promise-based JMAP client with default configuration.
 *
 * This fetches the JMAP session upfront to validate credentials and
 * discover the primary account ID. All subsequent method calls use
 * the same underlying Effect runtime (layers are constructed once).
 *
 * @param sessionUrl - JMAP session URL (e.g., 'https://api.fastmail.com/jmap/session')
 * @param bearerToken - API token for authentication
 * @returns A Promise-based JMAP client
 * @throws {AuthenticationError} If the bearer token is invalid
 * @throws {NetworkError} If the session endpoint is unreachable
 * @throws {SessionError} If the session response is malformed
 *
 * @example
 * ```typescript
 * const client = await createJMAPClient(
 *   'https://api.fastmail.com/jmap/session',
 *   'fmu1-...'
 * )
 * const mailboxes = await client.mailbox.getAll()
 * await client.dispose()
 * ```
 */
export const createJMAPClient = async (
  sessionUrl: string,
  bearerToken: string,
): Promise<JMAPClientWrapper> => {
  const layer = JMAPLive(sessionUrl, bearerToken)
  return buildClient(layer)
}

/**
 * Create a Promise-based JMAP client with custom configuration.
 *
 * @param config - Custom JMAP client configuration (timeout, retries, user agent, etc.)
 * @returns A Promise-based JMAP client
 *
 * @example
 * ```typescript
 * import { createJMAPClientWithConfig, defaultConfig } from 'effect-jmap'
 *
 * const client = await createJMAPClientWithConfig({
 *   ...defaultConfig('https://api.fastmail.com/jmap/session', 'token'),
 *   timeout: 60000,
 *   maxRetries: 5,
 * })
 * ```
 */
export const createJMAPClientWithConfig = async (
  config: JMAPClientConfig,
): Promise<JMAPClientWrapper> => {
  const layer = JMAPLiveWithConfig(config)
  return buildClient(layer)
}

/**
 * Create a Promise-based JMAP client from a pre-built Effect layer.
 *
 * This is useful for advanced scenarios like custom layer composition
 * or testing with mock layers.
 *
 * @param layer - A fully-constructed layer providing all JMAP services
 * @returns A Promise-based JMAP client
 */
export const createJMAPClientFromLayer = async (
  layer: ReturnType<typeof JMAPLive>,
): Promise<JMAPClientWrapper> => {
  return buildClient(layer)
}

/**
 * Internal: build the client wrapper from a fully-constructed layer.
 */
const buildClient = async (
  layer: ReturnType<typeof JMAPLive>,
): Promise<JMAPClientWrapper> => {
  const runtime = ManagedRuntime.make(layer)

  const run = <A, E>(effect: Effect.Effect<A, E, any>): Promise<A> =>
    runtime.runPromise(effect) as Promise<A>

  // Fetch session upfront — validates credentials and discovers account ID
  const session = await run(
    Effect.gen(function* () {
      const client = yield* JMAPClientService
      return yield* client.getSession
    }),
  )

  const accountId =
    session.primaryAccounts?.['urn:ietf:params:jmap:mail'] ??
    Object.keys(session.accounts)[0]

  if (!accountId) {
    throw new Error('No account ID found in JMAP session')
  }

  // Low-level batch
  const batch = (methodCalls: ReadonlyArray<Invocation>, using?: ReadonlyArray<string>): Promise<Response> =>
    run(
      Effect.gen(function* () {
        const client = yield* JMAPClientService
        return yield* client.batch(methodCalls, using)
      }),
    )

  // --- Mailbox namespace ---
  const mailbox: MailboxNamespace = {
    get: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.get(args)
      })),
    set: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.set(args)
      })),
    query: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.query(args)
      })),
    queryChanges: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.queryChanges(args)
      })),
    getAll: (acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.getAll(acct ?? accountId)
      })),
    findByRole: (role, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.findByRole(acct ?? accountId, role)
      })),
    getHierarchy: (parentId?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.getHierarchy(acct ?? accountId, parentId)
      })),
    create: (mailboxData, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.create(acct ?? accountId, mailboxData)
      })),
    update: (mailboxId, updates, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.update(acct ?? accountId, mailboxId, updates)
      })),
    destroy: (mailboxIds, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* MailboxService
        return yield* svc.destroy(acct ?? accountId, mailboxIds)
      })),
  }

  // --- Email namespace ---
  const email: EmailNamespace = {
    get: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.get(args)
      })),
    set: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.set(args)
      })),
    query: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.query(args)
      })),
    queryChanges: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.queryChanges(args)
      })),
    copy: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.copy(args)
      })),
    import: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.import(args)
      })),
    getByMailbox: (mailboxId, options?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.getByMailbox(acct ?? accountId, mailboxId, options)
      })),
    search: (searchQuery, options?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.search(acct ?? accountId, searchQuery, options)
      })),
    getUnread: (mailboxId?, limit?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.getUnread(acct ?? accountId, mailboxId, limit)
      })),
    markRead: (emailIds, read, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.markRead(acct ?? accountId, emailIds, read)
      })),
    flag: (emailIds, flagged, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.flag(acct ?? accountId, emailIds, flagged)
      })),
    move: (emailIds, fromMailboxId, toMailboxId, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.move(acct ?? accountId, emailIds, fromMailboxId, toMailboxId)
      })),
    updateKeywords: (emailIds, keywordsToAdd, keywordsToRemove, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.updateKeywords(acct ?? accountId, emailIds, keywordsToAdd, keywordsToRemove)
      })),
    getWithContent: (emailIds, maxBodyValueBytes?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.getWithContent(acct ?? accountId, emailIds, maxBodyValueBytes)
      })),
    getEmailContent: (emailId, maxBodyValueBytes?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.getEmailContent(acct ?? accountId, emailId, maxBodyValueBytes)
      })),
    destroy: (emailIds, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailService
        return yield* svc.destroy(acct ?? accountId, emailIds)
      })),
  }

  // --- Submission namespace ---
  const submission: SubmissionNamespace = {
    get: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.get(args)
      })),
    set: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.set(args)
      })),
    query: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.query(args)
      })),
    queryChanges: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.queryChanges(args)
      })),
    changes: (args) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.changes(args)
      })),
    send: (identityId, emailId, options?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.send(acct ?? accountId, identityId, emailId, options)
      })),
    getDeliveryStatus: (submissionId, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.getDeliveryStatus(acct ?? accountId, submissionId)
      })),
    cancelScheduled: (submissionId, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.cancelScheduled(acct ?? accountId, submissionId)
      })),
    getByEmailId: (emailId, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.getByEmailId(acct ?? accountId, emailId)
      })),
    getRecent: (limit?, acct?) =>
      run(Effect.gen(function* () {
        const svc = yield* EmailSubmissionService
        return yield* svc.getRecent(acct ?? accountId, limit)
      })),
  }

  return {
    accountId,
    session,
    batch,
    mailbox,
    email,
    submission,
    dispose: () => runtime.dispose(),
  }
}
