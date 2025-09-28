import { Context, Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform'
import { JMAPClientService } from '../core/JMAPClient.ts'
import { Request, Invocation } from '../core/Types.ts'
import { JMAPMethodError, NetworkError, AuthenticationError, SessionError } from '../core/Errors.ts'
import {
  Mailbox as MailboxType,
  MailboxGetArguments,
  MailboxGetResponse,
  MailboxSetArguments,
  MailboxSetResponse,
  MailboxQueryArguments,
  MailboxQueryResponse,
  MailboxQueryChangesArguments,
  MailboxQueryChangesResponse,
  MailboxMutable,
  MailboxFilterCondition,
  StandardRoles,
  MailboxHelpers
} from '../schemas/Mailbox.ts'
import { Id, Common } from '../schemas/Common.ts'
import * as Schema from 'effect/Schema'

/**
 * Mailbox Service Interface
 */
export interface MailboxService {
  /**
   * Get mailboxes by ID
   */
  readonly get: (
    args: MailboxGetArguments
  ) => Effect.Effect<
    MailboxGetResponse,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Create, update, or destroy mailboxes
   */
  readonly set: (
    args: MailboxSetArguments
  ) => Effect.Effect<
    MailboxSetResponse,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Query mailboxes with filters and sorting
   */
  readonly query: (
    args: MailboxQueryArguments
  ) => Effect.Effect<
    MailboxQueryResponse,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Get changes to a mailbox query
   */
  readonly queryChanges: (
    args: MailboxQueryChangesArguments
  ) => Effect.Effect<
    MailboxQueryChangesResponse,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Get all mailboxes for an account
   */
  readonly getAll: (
    accountId: string
  ) => Effect.Effect<
    MailboxType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Find mailboxes by role
   */
  readonly findByRole: (
    accountId: string,
    role: string
  ) => Effect.Effect<
    MailboxType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Get mailbox hierarchy
   */
  readonly getHierarchy: (
    accountId: string,
    parentId?: Id
  ) => Effect.Effect<
    MailboxType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Create a new mailbox
   */
  readonly create: (
    accountId: string,
    mailbox: MailboxMutable & { name: string }
  ) => Effect.Effect<
    MailboxType,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Update an existing mailbox
   */
  readonly update: (
    accountId: string,
    mailboxId: Id,
    updates: Partial<MailboxMutable>
  ) => Effect.Effect<
    MailboxType | null,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >

  /**
   * Delete a mailbox
   */
  readonly destroy: (
    accountId: string,
    mailboxIds: Id[]
  ) => Effect.Effect<
    Id[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    HttpClient.HttpClient
  >
}

/**
 * Mailbox Service Tag
 */
export const MailboxService = Context.GenericTag<MailboxService>('MailboxService')

/**
 * Live implementation of Mailbox Service
 */
const makeMailboxServiceLive = (): MailboxService => {
  const extractMethodResponse = <T>(
    response: any,
    methodName: string,
    callId: string,
    schema: Schema.Schema<T>
  ): Effect.Effect<T, JMAPMethodError> => {
    if (!response.methodResponses) {
      return Effect.fail(
        JMAPMethodError.fromMethodError(
          { type: 'invalidArguments', description: 'No method responses in JMAP response' },
          callId
        )
      )
    }

    const methodResponse = response.methodResponses.find(
      ([name, _, id]: [string, any, string]) => name === methodName && id === callId
    )

    if (!methodResponse) {
      return Effect.fail(
        JMAPMethodError.fromMethodError(
          { type: 'serverFail', description: `Method response not found for ${methodName}` },
          callId
        )
      )
    }

    const [, result] = methodResponse

    return Schema.decodeUnknown(schema)(result).pipe(
      Effect.catchAll(error =>
        Effect.fail(
          JMAPMethodError.fromMethodError(
            { type: 'serverFail', description: `Invalid response format: ${error}` },
            callId
          )
        )
      )
    )
  }

  const get: MailboxService['get'] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService
      const callId = `mailbox-get-${Date.now()}`

      const methodCall: Invocation = [
        'Mailbox/get',
        args,
        callId
      ]

      const request: Request = {
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
        methodCalls: [methodCall]
      }

      const response = yield* client.batch([methodCall])
      return yield* extractMethodResponse(response, 'Mailbox/get', callId, MailboxGetResponse)
    })

  const set: MailboxService['set'] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService
      const callId = `mailbox-set-${Date.now()}`

      const methodCall: Invocation = [
        'Mailbox/set',
        args,
        callId
      ]

      const response = yield* client.batch([methodCall])
      return yield* extractMethodResponse(response, 'Mailbox/set', callId, MailboxSetResponse)
    })

  const query: MailboxService['query'] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService
      const callId = `mailbox-query-${Date.now()}`

      const methodCall: Invocation = [
        'Mailbox/query',
        args,
        callId
      ]

      const response = yield* client.batch([methodCall])
      return yield* extractMethodResponse(response, 'Mailbox/query', callId, MailboxQueryResponse)
    })

  const queryChanges: MailboxService['queryChanges'] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService
      const callId = `mailbox-queryChanges-${Date.now()}`

      const methodCall: Invocation = [
        'Mailbox/queryChanges',
        args,
        callId
      ]

      const response = yield* client.batch([methodCall])
      return yield* extractMethodResponse(response, 'Mailbox/queryChanges', callId, MailboxQueryChangesResponse)
    })

  const getAll: MailboxService['getAll'] = (accountId) =>
    Effect.gen(function* () {
      const result = yield* get({
        accountId,
        ids: null
      })
      return result.list
    })

  const findByRole: MailboxService['findByRole'] = (accountId, role) =>
    Effect.gen(function* () {
      const queryResult = yield* query({
        accountId,
        filter: {
          role: role as any
        }
      })

      if (queryResult.ids.length === 0) {
        return []
      }

      const getResult = yield* get({
        accountId,
        ids: queryResult.ids
      })

      return getResult.list
    })

  const getHierarchy: MailboxService['getHierarchy'] = (accountId, parentId) =>
    Effect.gen(function* () {
      const allMailboxes = yield* getAll(accountId)

      if (!parentId) {
        // Return root mailboxes (no parent)
        return allMailboxes.filter(m => m.parentId === null)
      }

      return MailboxHelpers.getChildren(parentId, allMailboxes)
    })

  const create: MailboxService['create'] = (accountId, mailbox) =>
    Effect.gen(function* () {
      const tempId = `temp-${Date.now()}`

      const result = yield* set({
        accountId,
        create: {
          [tempId]: mailbox
        }
      })

      if (!result.created || !result.created[tempId]) {
        const error = result.notCreated?.[tempId] || { type: 'serverFail', description: 'Unknown error creating mailbox' }
        yield* Effect.fail(
          JMAPMethodError.fromMethodError(error, `create-${tempId}`)
        )
      }

      return result.created![tempId]
    })

  const update: MailboxService['update'] = (accountId, mailboxId, updates) =>
    Effect.gen(function* () {
      const result = yield* set({
        accountId,
        update: {
          [mailboxId]: updates
        }
      })

      if (result.notUpdated && result.notUpdated[mailboxId]) {
        const error = result.notUpdated[mailboxId]
        yield* Effect.fail(
          JMAPMethodError.fromMethodError(error, `update-${mailboxId}`)
        )
      }

      return result.updated?.[mailboxId] || null
    })

  const destroy: MailboxService['destroy'] = (accountId, mailboxIds) =>
    Effect.gen(function* () {
      const result = yield* set({
        accountId,
        destroy: mailboxIds
      })

      // Check for errors
      const notDestroyed = result.notDestroyed
      if (notDestroyed) {
        const errorIds = Object.keys(notDestroyed)
        if (errorIds.length > 0) {
          const firstError = notDestroyed[errorIds[0] as Id]
          yield* Effect.fail(
            JMAPMethodError.fromMethodError(firstError, `destroy-${errorIds[0]}`)
          )
        }
      }

      return result.destroyed || []
    })

  return {
    get,
    set,
    query,
    queryChanges,
    getAll,
    findByRole,
    getHierarchy,
    create,
    update,
    destroy
  }
}

/**
 * Live layer for Mailbox Service
 */
export const MailboxServiceLive = Layer.succeed(MailboxService, makeMailboxServiceLive())

/**
 * Convenience functions for common mailbox operations
 */
export const MailboxOperations = {
  /**
   * Get the inbox mailbox
   */
  getInbox: (accountId: string) =>
    Effect.gen(function* () {
      const service = yield* MailboxService
      const inboxes = yield* service.findByRole(accountId, StandardRoles.INBOX)
      return inboxes[0] || null
    }),

  /**
   * Get the sent mailbox
   */
  getSent: (accountId: string) =>
    Effect.gen(function* () {
      const service = yield* MailboxService
      const sentBoxes = yield* service.findByRole(accountId, StandardRoles.SENT)
      return sentBoxes[0] || null
    }),

  /**
   * Get the drafts mailbox
   */
  getDrafts: (accountId: string) =>
    Effect.gen(function* () {
      const service = yield* MailboxService
      const draftBoxes = yield* service.findByRole(accountId, StandardRoles.DRAFTS)
      return draftBoxes[0] || null
    }),

  /**
   * Get the trash mailbox
   */
  getTrash: (accountId: string) =>
    Effect.gen(function* () {
      const service = yield* MailboxService
      const trashBoxes = yield* service.findByRole(accountId, StandardRoles.TRASH)
      return trashBoxes[0] || null
    }),

  /**
   * Create a folder hierarchy
   */
  createHierarchy: (accountId: string, path: string[]) =>
    Effect.gen(function* () {
      const service = yield* MailboxService
      let parentId: Id | null = null

      const created: MailboxType[] = []

      for (const name of path) {
        const mailbox = yield* service.create(accountId, {
          name,
          parentId,
          sortOrder: Common.createUnsignedInt(0)
        })
        created.push(mailbox)
        parentId = mailbox.id
      }

      return created
    }),

  /**
   * Move a mailbox to a new parent
   */
  moveMailbox: (accountId: string, mailboxId: Id, newParentId: Id | null) =>
    Effect.gen(function* () {
      const service = yield* MailboxService
      return yield* service.update(accountId, mailboxId, {
        parentId: newParentId
      })
    }),

  /**
   * Rename a mailbox
   */
  renameMailbox: (accountId: string, mailboxId: Id, newName: string) =>
    Effect.gen(function* () {
      const service = yield* MailboxService
      return yield* service.update(accountId, mailboxId, {
        name: newName
      })
    })
}