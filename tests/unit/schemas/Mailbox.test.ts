import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import {
  Mailbox,
  MailboxRole,
  MailboxRights,
  MailboxFilterCondition,
  MailboxMutable,
  StandardRoles,
  MailboxHelpers
} from '../../../src/schemas/Mailbox.js'
import { Common } from '../../../src/schemas/Common.js'

describe('Mailbox Schema', () => {
  describe('MailboxRole', () => {
    it('should validate standard mailbox roles', () => {
      const validRoles = ['inbox', 'sent', 'drafts', 'trash', 'junk', 'archive']

      validRoles.forEach(role => {
        const result = Schema.decodeUnknownSync(MailboxRole)(role)
        expect(result).toBe(role)
      })
    })

    it('should reject invalid roles', () => {
      expect(() => Schema.decodeUnknownSync(MailboxRole)('invalid-role')).toThrow()
    })
  })

  describe('MailboxRights', () => {
    it('should validate complete rights object', () => {
      const rights = {
        mayReadItems: true,
        mayAddItems: true,
        mayRemoveItems: false,
        maySetSeen: true,
        maySetKeywords: true,
        mayCreateChild: false,
        mayRename: true,
        mayDelete: false,
        maySubmit: true
      }

      const result = Schema.decodeUnknownSync(MailboxRights)(rights)
      expect(result).toEqual(rights)
    })

    it('should require all rights properties', () => {
      const incompleteRights = {
        mayReadItems: true,
        mayAddItems: true
        // missing other properties
      }

      expect(() => Schema.decodeUnknownSync(MailboxRights)(incompleteRights)).toThrow()
    })
  })

  describe('Mailbox', () => {
    const validMailbox = {
      id: 'mailbox-1',
      name: 'Inbox',
      parentId: null,
      role: 'inbox',
      sortOrder: 0,
      totalEmails: 10,
      unreadEmails: 2,
      totalThreads: 8,
      unreadThreads: 1,
      myRights: {
        mayReadItems: true,
        mayAddItems: true,
        mayRemoveItems: true,
        maySetSeen: true,
        maySetKeywords: true,
        mayCreateChild: true,
        mayRename: false,
        mayDelete: false,
        maySubmit: true
      },
      isSubscribed: true
    }

    it('should validate a complete mailbox', () => {
      const result = Schema.decodeUnknownSync(Mailbox)(validMailbox)
      expect(result).toEqual(validMailbox)
    })

    it('should allow null parentId and role', () => {
      const mailboxWithNulls = {
        ...validMailbox,
        parentId: null,
        role: null
      }

      const result = Schema.decodeUnknownSync(Mailbox)(mailboxWithNulls)
      expect(result.parentId).toBeNull()
      expect(result.role).toBeNull()
    })

    it('should reject negative counts', () => {
      const invalidMailbox = {
        ...validMailbox,
        totalEmails: -1
      }

      expect(() => Schema.decodeUnknownSync(Mailbox)(invalidMailbox)).toThrow()
    })
  })

  describe('MailboxFilterCondition', () => {
    it('should validate filter with all optional properties', () => {
      const filter = {
        parentId: 'parent-1',
        name: 'Test',
        role: 'inbox',
        hasAnyRole: true,
        isSubscribed: false
      }

      const result = Schema.decodeUnknownSync(MailboxFilterCondition)(filter)
      expect(result).toEqual(filter)
    })

    it('should validate empty filter', () => {
      const emptyFilter = {}
      const result = Schema.decodeUnknownSync(MailboxFilterCondition)(emptyFilter)
      expect(result).toEqual({})
    })
  })

  describe('MailboxMutable', () => {
    it('should validate mutable properties', () => {
      const mutableProps = {
        name: 'New Name',
        parentId: 'new-parent',
        sortOrder: 5,
        isSubscribed: false
      }

      const result = Schema.decodeUnknownSync(MailboxMutable)(mutableProps)
      expect(result).toEqual(mutableProps)
    })

    it('should allow partial updates', () => {
      const partialUpdate = { name: 'Updated Name' }
      const result = Schema.decodeUnknownSync(MailboxMutable)(partialUpdate)
      expect(result).toEqual(partialUpdate)
    })
  })

  describe('StandardRoles', () => {
    it('should provide standard role constants', () => {
      expect(StandardRoles.INBOX).toBe('inbox')
      expect(StandardRoles.SENT).toBe('sent')
      expect(StandardRoles.DRAFTS).toBe('drafts')
      expect(StandardRoles.TRASH).toBe('trash')
      expect(StandardRoles.JUNK).toBe('junk')
      expect(StandardRoles.ARCHIVE).toBe('archive')
    })
  })

  describe('MailboxHelpers', () => {
    const mailboxes = [
      {
        id: Common.createId('inbox'),
        name: 'Inbox',
        parentId: null,
        role: 'inbox' as const,
        sortOrder: Common.createUnsignedInt(0),
        totalEmails: Common.createUnsignedInt(10),
        unreadEmails: Common.createUnsignedInt(2),
        totalThreads: Common.createUnsignedInt(8),
        unreadThreads: Common.createUnsignedInt(1),
        myRights: {
          mayReadItems: true,
          mayAddItems: true,
          mayRemoveItems: true,
          maySetSeen: true,
          maySetKeywords: true,
          mayCreateChild: true,
          mayRename: false,
          mayDelete: false,
          maySubmit: true
        },
        isSubscribed: true
      },
      {
        id: Common.createId('folder1'),
        name: 'Folder 1',
        parentId: Common.createId('inbox'),
        role: null,
        sortOrder: Common.createUnsignedInt(1),
        totalEmails: Common.createUnsignedInt(5),
        unreadEmails: Common.createUnsignedInt(0),
        totalThreads: Common.createUnsignedInt(4),
        unreadThreads: Common.createUnsignedInt(0),
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
    ]

    describe('hasRole', () => {
      it('should correctly identify mailbox role', () => {
        expect(MailboxHelpers.hasRole(mailboxes[0], 'inbox')).toBe(true)
        expect(MailboxHelpers.hasRole(mailboxes[0], 'sent')).toBe(false)
        expect(MailboxHelpers.hasRole(mailboxes[1], 'inbox')).toBe(false)
      })
    })

    describe('isSystemMailbox', () => {
      it('should identify system mailboxes', () => {
        expect(MailboxHelpers.isSystemMailbox(mailboxes[0])).toBe(true)
        expect(MailboxHelpers.isSystemMailbox(mailboxes[1])).toBe(false)
      })
    })

    describe('canCreateChild', () => {
      it('should check create child permissions', () => {
        expect(MailboxHelpers.canCreateChild(mailboxes[0])).toBe(true)
        expect(MailboxHelpers.canCreateChild(mailboxes[1])).toBe(true)
      })
    })

    describe('canRename', () => {
      it('should check rename permissions', () => {
        expect(MailboxHelpers.canRename(mailboxes[0])).toBe(false)
        expect(MailboxHelpers.canRename(mailboxes[1])).toBe(true)
      })
    })

    describe('canDelete', () => {
      it('should check delete permissions', () => {
        expect(MailboxHelpers.canDelete(mailboxes[0])).toBe(false)
        expect(MailboxHelpers.canDelete(mailboxes[1])).toBe(true)
      })
    })

    describe('getDepth', () => {
      it('should calculate mailbox depth correctly', () => {
        expect(MailboxHelpers.getDepth(mailboxes[0], mailboxes)).toBe(0)
        expect(MailboxHelpers.getDepth(mailboxes[1], mailboxes)).toBe(1)
      })
    })

    describe('getChildren', () => {
      it('should find child mailboxes', () => {
        const children = MailboxHelpers.getChildren(Common.createId('inbox'), mailboxes)
        expect(children).toHaveLength(1)
        expect(children[0].id).toBe('folder1')
      })

      it('should return empty array for no children', () => {
        const children = MailboxHelpers.getChildren(Common.createId('folder1'), mailboxes)
        expect(children).toHaveLength(0)
      })
    })

    describe('getAncestors', () => {
      it('should find ancestor mailboxes', () => {
        const ancestors = MailboxHelpers.getAncestors(mailboxes[1], mailboxes)
        expect(ancestors).toHaveLength(1)
        expect(ancestors[0].id).toBe('inbox')
      })

      it('should return empty array for root mailbox', () => {
        const ancestors = MailboxHelpers.getAncestors(mailboxes[0], mailboxes)
        expect(ancestors).toHaveLength(0)
      })
    })
  })
})