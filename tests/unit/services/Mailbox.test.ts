import { describe, it, expect, beforeEach } from 'vitest'
import { Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform'
import { JMAPClient } from '../../../src/core/JMAPClient.js'
import { MailboxService, MailboxServiceLive, MailboxOperations } from '../../../src/services/Mailbox.js'
import { Common } from '../../../src/schemas/Common.js'
import { StandardRoles } from '../../../src/schemas/Mailbox.js'
import { JMAPFixtures } from '../../fixtures/jmap-responses.js'
import { TestUtils } from '../../utils/test-utils.js'

describe('MailboxService', () => {
  // Mock JMAP Client
  const mockJMAPClient: JMAPClient = {
    getSession: Effect.succeed(JMAPFixtures.session as any),
    request: Effect.succeed({} as any),
    batch: (methodCalls) => {
      // Simple mock that returns predefined responses based on method name
      const [methodName] = methodCalls[0]

      if (methodName === 'Mailbox/get') {
        return Effect.succeed({
          methodResponses: [
            ['Mailbox/get', {
              accountId: 'account-1',
              state: 'state-1',
              list: JMAPFixtures.mailboxes,
              notFound: []
            }, methodCalls[0][2]]
          ]
        })
      }

      if (methodName === 'Mailbox/query') {
        return Effect.succeed({
          methodResponses: [
            ['Mailbox/query', {
              accountId: 'account-1',
              queryState: 'query-state-1',
              canCalculateChanges: true,
              position: 0,
              ids: ['mailbox-1'],
              total: 1
            }, methodCalls[0][2]]
          ]
        })
      }

      if (methodName === 'Mailbox/set') {
        const args = methodCalls[0][1] as any

        if (args.create) {
          const tempId = Object.keys(args.create)[0]
          const newMailbox = {
            id: 'new-mailbox-id',
            ...args.create[tempId],
            parentId: args.create[tempId].parentId || null,
            role: args.create[tempId].role || null,
            totalEmails: 0,
            unreadEmails: 0,
            totalThreads: 0,
            unreadThreads: 0,
            myRights: {
              mayReadItems: true,
              mayAddItems: true,
              mayRemoveItems: true,
              maySetSeen: true,
              maySetKeywords: true,
              mayCreateChild: true,
              mayRename: true,
              mayDelete: true,
              maySubmit: true
            },
            isSubscribed: true
          }

          return Effect.succeed({
            methodResponses: [
              ['Mailbox/set', {
                accountId: 'account-1',
                oldState: 'state-1',
                newState: 'state-2',
                created: {
                  [tempId]: newMailbox
                }
              }, methodCalls[0][2]]
            ]
          })
        }

        if (args.update) {
          const mailboxId = Object.keys(args.update)[0]
          const updatedMailbox = {
            ...JMAPFixtures.mailboxes[0],
            ...args.update[mailboxId]
          }

          return Effect.succeed({
            methodResponses: [
              ['Mailbox/set', {
                accountId: 'account-1',
                oldState: 'state-1',
                newState: 'state-2',
                updated: {
                  [mailboxId]: updatedMailbox
                }
              }, methodCalls[0][2]]
            ]
          })
        }

        if (args.destroy) {
          return Effect.succeed({
            methodResponses: [
              ['Mailbox/set', {
                accountId: 'account-1',
                oldState: 'state-1',
                newState: 'state-2',
                destroyed: args.destroy
              }, methodCalls[0][2]]
            ]
          })
        }
      }

      return Effect.succeed({
        methodResponses: [['unknown', {}, methodCalls[0][2]]]
      })
    },
    getSessionState: Effect.succeed('session-state-1')
  }

  const mockJMAPClientLayer = Layer.succeed(JMAPClient, mockJMAPClient)
  const testLayer = Layer.provideMerge(MailboxServiceLive, mockJMAPClientLayer)

  describe('get', () => {
    it('should retrieve all mailboxes when ids is null', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.get({
          accountId: 'account-1',
          ids: null
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual({
        accountId: 'account-1',
        state: 'state-1',
        list: JMAPFixtures.mailboxes,
        notFound: []
      })
    })

    it('should retrieve specific mailboxes when ids provided', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.get({
          accountId: 'account-1',
          ids: [Common.createId('mailbox-1')]
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result.accountId).toBe('account-1')
      expect(result.list).toEqual(JMAPFixtures.mailboxes)
    })
  })

  describe('query', () => {
    it('should query mailboxes with filters', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.query({
          accountId: 'account-1',
          filter: {
            role: 'inbox'
          }
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual({
        accountId: 'account-1',
        queryState: 'query-state-1',
        canCalculateChanges: true,
        position: 0,
        ids: ['mailbox-1'],
        total: 1
      })
    })
  })

  describe('getAll', () => {
    it('should retrieve all mailboxes for an account', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.getAll('account-1')
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual(JMAPFixtures.mailboxes)
    })
  })

  describe('findByRole', () => {
    it('should find mailboxes by role', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.findByRole('account-1', StandardRoles.INBOX)
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual(JMAPFixtures.mailboxes)
    })
  })

  describe('create', () => {
    it('should create a new mailbox', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.create('account-1', {
          name: 'New Folder',
          sortOrder: Common.createUnsignedInt(10)
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result.id).toBe('new-mailbox-id')
      expect(result.name).toBe('New Folder')
      expect(result.sortOrder).toBe(10)
    })
  })

  describe('update', () => {
    it('should update an existing mailbox', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.update('account-1', Common.createId('mailbox-1'), {
          name: 'Updated Name'
        })
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toBeTruthy()
      expect(result!.name).toBe('Updated Name')
    })
  })

  describe('destroy', () => {
    it('should delete mailboxes', async () => {
      const effect = Effect.gen(function* () {
        const service = yield* MailboxService
        return yield* service.destroy('account-1', [Common.createId('mailbox-1')])
      })

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toEqual([Common.createId('mailbox-1')])
    })
  })
})

describe('MailboxOperations', () => {
  const mockJMAPClient: JMAPClient = {
    getSession: Effect.succeed(JMAPFixtures.session as any),
    request: Effect.succeed({} as any),
    batch: (methodCalls) => {
      const [methodName] = methodCalls[0]

      if (methodName === 'Mailbox/query') {
        return Effect.succeed({
          methodResponses: [
            ['Mailbox/query', {
              accountId: 'account-1',
              queryState: 'query-state-1',
              canCalculateChanges: true,
              position: 0,
              ids: ['mailbox-1'],
              total: 1
            }, methodCalls[0][2]]
          ]
        })
      }

      if (methodName === 'Mailbox/get') {
        return Effect.succeed({
          methodResponses: [
            ['Mailbox/get', {
              accountId: 'account-1',
              state: 'state-1',
              list: [JMAPFixtures.mailboxes[0]],
              notFound: []
            }, methodCalls[0][2]]
          ]
        })
      }

      return Effect.succeed({
        methodResponses: [['unknown', {}, methodCalls[0][2]]]
      })
    },
    getSessionState: Effect.succeed('session-state-1')
  }

  const mockJMAPClientLayer = Layer.succeed(JMAPClient, mockJMAPClient)
  const testLayer = Layer.provideMerge(MailboxServiceLive, mockJMAPClientLayer)

  describe('getInbox', () => {
    it('should find the inbox mailbox', async () => {
      const effect = MailboxOperations.getInbox('account-1')

      const result = await TestUtils.runEffectWithLayer(effect, testLayer)

      expect(result).toBeTruthy()
      expect(result!.role).toBe('inbox')
      expect(result!.name).toBe('Inbox')
    })
  })

  describe('createHierarchy', () => {
    it('should create nested mailbox structure', async () => {
      const createResponses = [
        { id: 'folder-1', name: 'Projects', parentId: null, sortOrder: 0 },
        { id: 'folder-2', name: 'Work', parentId: 'folder-1', sortOrder: 0 },
        { id: 'folder-3', name: 'Client A', parentId: 'folder-2', sortOrder: 0 }
      ]

      let responseIndex = 0
      const mockClientWithCreate: JMAPClient = {
        ...mockJMAPClient,
        batch: (methodCalls) => {
          const [methodName, args] = methodCalls[0]

          if (methodName === 'Mailbox/set' && (args as any).create) {
            const tempId = Object.keys((args as any).create)[0]
            const response = createResponses[responseIndex]
            responseIndex++

            return Effect.succeed({
              methodResponses: [
                ['Mailbox/set', {
                  accountId: 'account-1',
                  oldState: 'state-1',
                  newState: 'state-2',
                  created: {
                    [tempId]: {
                      ...response,
                      role: null,
                      totalEmails: 0,
                      unreadEmails: 0,
                      totalThreads: 0,
                      unreadThreads: 0,
                      myRights: {
                        mayReadItems: true,
                        mayAddItems: true,
                        mayRemoveItems: true,
                        maySetSeen: true,
                        maySetKeywords: true,
                        mayCreateChild: true,
                        mayRename: true,
                        mayDelete: true,
                        maySubmit: true
                      },
                      isSubscribed: true
                    }
                  }
                }, methodCalls[0][2]]
              ]
            })
          }

          return Effect.succeed({
            methodResponses: [['unknown', {}, methodCalls[0][2]]]
          })
        }
      }

      const mockLayerWithCreate = Layer.succeed(JMAPClient, mockClientWithCreate)
      const testLayerWithCreate = Layer.provideMerge(MailboxServiceLive, mockLayerWithCreate)

      const effect = MailboxOperations.createHierarchy('account-1', ['Projects', 'Work', 'Client A'])

      const result = await TestUtils.runEffectWithLayer(effect, testLayerWithCreate)

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Projects')
      expect(result[0].parentId).toBeNull()
      expect(result[1].name).toBe('Work')
      expect(result[1].parentId).toBe('folder-1')
      expect(result[2].name).toBe('Client A')
      expect(result[2].parentId).toBe('folder-2')
    })
  })
})