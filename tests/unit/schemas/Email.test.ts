import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import {
  Email,
  EmailHeader,
  EmailHeaders,
  EmailBodyPart,
  EmailBody,
  EmailBodyValues,
  EmailAttachment,
  EmailFilterCondition,
  EmailMutable,
  EmailGetArguments,
  EmailGetResponse,
  EmailSetArguments,
  EmailSetResponse,
  EmailQueryArguments,
  EmailQueryResponse,
  EmailHelpers,
  StandardProperties
} from '../../../src/schemas/Email.ts'
import { Common, EmailAddress, Keywords, StandardKeywords } from '../../../src/schemas/Common.ts'

describe('Email Schema', () => {
  describe('EmailHeader', () => {
    it('should validate email header', () => {
      const header = {
        name: 'Content-Type',
        value: 'text/html; charset=utf-8'
      }

      const result = Schema.decodeUnknownSync(EmailHeader)(header)
      expect(result).toEqual(header)
    })

    it('should require name and value', () => {
      expect(() => Schema.decodeUnknownSync(EmailHeader)({ name: 'test' })).toThrow()
      expect(() => Schema.decodeUnknownSync(EmailHeader)({ value: 'test' })).toThrow()
    })
  })

  describe('EmailHeaders', () => {
    it('should validate headers collection', () => {
      const headers = {
        'content-type': ['text/html; charset=utf-8'],
        'message-id': ['<test@example.com>'],
        'from': ['sender@example.com']
      }

      const result = Schema.decodeUnknownSync(EmailHeaders)(headers)
      expect(result).toEqual(headers)
    })
  })

  describe('EmailBodyPart', () => {
    it('should validate basic body part', () => {
      const bodyPart = {
        partId: '1',
        blobId: 'blob123',
        size: Common.createUnsignedInt(1024),
        type: 'text/plain',
        charset: 'utf-8'
      }

      const result = Schema.decodeUnknownSync(EmailBodyPart)(bodyPart)
      expect(result.partId).toBe('1')
      expect(result.type).toBe('text/plain')
      expect(result.charset).toBe('utf-8')
    })

    it('should validate nested body parts', () => {
      const bodyPart = {
        type: 'multipart/mixed',
        subParts: [
          {
            partId: '1.1',
            type: 'text/plain',
            size: Common.createUnsignedInt(512)
          },
          {
            partId: '1.2',
            type: 'text/html',
            size: Common.createUnsignedInt(1024)
          }
        ]
      }

      const result = Schema.decodeUnknownSync(EmailBodyPart)(bodyPart)
      expect(result.subParts).toHaveLength(2)
      expect(result.subParts![0].partId).toBe('1.1')
    })

    it('should validate attachment part', () => {
      const bodyPart = {
        partId: '2',
        blobId: 'blob456',
        size: Common.createUnsignedInt(2048),
        type: 'image/png',
        disposition: 'attachment',
        name: 'photo.png'
      }

      const result = Schema.decodeUnknownSync(EmailBodyPart)(bodyPart)
      expect(result.disposition).toBe('attachment')
      expect(result.name).toBe('photo.png')
    })

    it('should validate body part with null values', () => {
      const bodyPart = {
        partId: '3',
        blobId: 'blob789',
        size: Common.createUnsignedInt(1024),
        type: 'text/plain',
        charset: null,
        disposition: null,
        cid: null,
        name: null,
        language: null,
        location: null
      }

      const result = Schema.decodeUnknownSync(EmailBodyPart)(bodyPart)
      expect(result.charset).toBeNull()
      expect(result.disposition).toBeNull()
      expect(result.cid).toBeNull()
      expect(result.name).toBeNull()
      expect(result.language).toBeNull()
      expect(result.location).toBeNull()
    })
  })

  describe('EmailBody', () => {
    it('should validate email body structure', () => {
      const body = {
        type: 'multipart/alternative',
        subParts: [
          {
            partId: '1',
            type: 'text/plain',
            size: Common.createUnsignedInt(256)
          },
          {
            partId: '2',
            type: 'text/html',
            size: Common.createUnsignedInt(512)
          }
        ]
      }

      const result = Schema.decodeUnknownSync(EmailBody)(body)
      expect(result.type).toBe('multipart/alternative')
      expect(result.subParts).toHaveLength(2)
    })
  })

  describe('EmailBodyValues', () => {
    it('should validate body values', () => {
      const bodyValues = {
        '1': {
          value: 'Hello, world!',
          isEncodingProblem: false,
          isTruncated: false
        },
        '2': {
          value: '<p>Hello, <strong>world</strong>!</p>',
          isTruncated: false
        }
      }

      const result = Schema.decodeUnknownSync(EmailBodyValues)(bodyValues)
      expect(result['1'].value).toBe('Hello, world!')
      expect(result['2'].value).toBe('<p>Hello, <strong>world</strong>!</p>')
    })

    it('should handle truncated content', () => {
      const bodyValues = {
        '1': {
          value: 'This content is truncated...',
          isTruncated: true
        }
      }

      const result = Schema.decodeUnknownSync(EmailBodyValues)(bodyValues)
      expect(result['1'].isTruncated).toBe(true)
    })
  })

  describe('EmailAttachment', () => {
    it('should validate attachment', () => {
      const attachment = {
        blobId: 'blob123',
        type: 'application/pdf',
        name: 'document.pdf',
        size: Common.createUnsignedInt(1048576),
        disposition: 'attachment'
      }

      const result = Schema.decodeUnknownSync(EmailAttachment)(attachment)
      expect(result.name).toBe('document.pdf')
      expect(result.type).toBe('application/pdf')
    })

    it('should validate inline attachment', () => {
      const attachment = {
        blobId: 'blob456',
        type: 'image/jpeg',
        name: 'image.jpg',
        size: Common.createUnsignedInt(204800),
        cid: 'image1@example.com',
        isInline: true
      }

      const result = Schema.decodeUnknownSync(EmailAttachment)(attachment)
      expect(result.cid).toBe('image1@example.com')
      expect(result.isInline).toBe(true)
    })

    it('should validate attachment with null values', () => {
      const attachment = {
        blobId: 'blob789',
        type: 'application/pdf',
        name: null,
        size: Common.createUnsignedInt(102400),
        cid: null,
        disposition: null
      }

      const result = Schema.decodeUnknownSync(EmailAttachment)(attachment)
      expect(result.name).toBeNull()
      expect(result.cid).toBeNull()
      expect(result.disposition).toBeNull()
    })

    it('should require blobId, type, and size', () => {
      expect(() => Schema.decodeUnknownSync(EmailAttachment)({
        type: 'image/png',
        size: Common.createUnsignedInt(1024)
      })).toThrow()
    })
  })

  describe('Email', () => {
    const createValidEmail = () => {
      const inboxId = Common.createId('inbox')
      return {
        id: Common.createId('email123'),
        blobId: 'blob123',
        threadId: Common.createId('thread123'),
        mailboxIds: {
          [inboxId]: true
        },
        keywords: {
          [StandardKeywords.SEEN]: true
        },
        size: Common.createUnsignedInt(2048),
        receivedAt: Common.now(),
        from: [{ email: 'sender@example.com', name: 'Test Sender' }],
        to: [{ email: 'recipient@example.com', name: 'Test Recipient' }],
        subject: 'Test Email',
        hasAttachment: false
      }
    }

    it('should validate complete email', () => {
      const email = createValidEmail()
      const result = Schema.decodeUnknownSync(Email)(email)

      expect(result.subject).toBe('Test Email')
      expect(result.hasAttachment).toBe(false)
      expect(result.from).toHaveLength(1)
      expect(result.from![0].email).toBe('sender@example.com')
    })

    it('should validate email with attachments', () => {
      const email = {
        ...createValidEmail(),
        hasAttachment: true,
        attachments: [
          {
            blobId: 'blob456',
            type: 'image/png',
            name: 'image.png',
            size: Common.createUnsignedInt(1024)
          }
        ]
      }

      const result = Schema.decodeUnknownSync(Email)(email)
      expect(result.hasAttachment).toBe(true)
      expect(result.attachments).toHaveLength(1)
    })

    it('should validate email with body content', () => {
      const email = {
        ...createValidEmail(),
        textBody: [
          {
            partId: '1',
            type: 'text/plain',
            size: Common.createUnsignedInt(256)
          }
        ],
        htmlBody: [
          {
            partId: '2',
            type: 'text/html',
            size: Common.createUnsignedInt(512)
          }
        ],
        bodyValues: {
          '1': {
            value: 'Plain text content',
            isTruncated: false
          },
          '2': {
            value: '<p>HTML content</p>',
            isTruncated: false
          }
        }
      }

      const result = Schema.decodeUnknownSync(Email)(email)
      expect(result.textBody).toHaveLength(1)
      expect(result.htmlBody).toHaveLength(1)
      expect(result.bodyValues!['1'].value).toBe('Plain text content')
    })

    it('should require mandatory fields', () => {
      expect(() => Schema.decodeUnknownSync(Email)({
        blobId: 'blob123',
        threadId: Common.createId('thread123')
      })).toThrow()
    })
  })

  describe('EmailFilterCondition', () => {
    it('should validate basic filter conditions', () => {
      const filter = {
        inMailbox: Common.createId('inbox'),
        hasKeyword: StandardKeywords.SEEN,
        after: Common.now()
      }

      const result = Schema.decodeUnknownSync(EmailFilterCondition)(filter)
      expect(result.hasKeyword).toBe(StandardKeywords.SEEN)
    })

    it('should validate text search filters', () => {
      const filter = {
        text: 'search query',
        from: 'sender@example.com',
        subject: 'Important',
        hasAttachment: true
      }

      const result = Schema.decodeUnknownSync(EmailFilterCondition)(filter)
      expect(result.text).toBe('search query')
      expect(result.hasAttachment).toBe(true)
    })

    it('should validate size filters', () => {
      const filter = {
        minSize: Common.createUnsignedInt(1024),
        maxSize: Common.createUnsignedInt(1048576)
      }

      const result = Schema.decodeUnknownSync(EmailFilterCondition)(filter)
      expect(result.minSize).toBeDefined()
      expect(result.maxSize).toBeDefined()
    })
  })

  describe('EmailMutable', () => {
    it('should validate mutable properties', () => {
      const mutable = {
        mailboxIds: {
          [Common.createId('inbox')]: false,
          [Common.createId('archive')]: true
        },
        keywords: {
          [StandardKeywords.SEEN]: true,
          [StandardKeywords.FLAGGED]: false
        }
      }

      const result = Schema.decodeUnknownSync(EmailMutable)(mutable)
      expect(result.keywords![StandardKeywords.SEEN]).toBe(true)
    })
  })

  describe('EmailGetArguments', () => {
    it('should validate get arguments', () => {
      const args = {
        accountId: 'account123',
        ids: [Common.createId('email1'), Common.createId('email2')],
        properties: ['id', 'subject', 'from'],
        fetchTextBodyValues: true,
        maxBodyValueBytes: Common.createUnsignedInt(10240)
      }

      const result = Schema.decodeUnknownSync(EmailGetArguments)(args)
      expect(result.fetchTextBodyValues).toBe(true)
      expect(result.properties).toHaveLength(3)
    })

    it('should validate get all emails', () => {
      const args = {
        accountId: 'account123',
        ids: null
      }

      const result = Schema.decodeUnknownSync(EmailGetArguments)(args)
      expect(result.ids).toBeNull()
    })
  })

  describe('EmailQueryArguments', () => {
    it('should validate query arguments', () => {
      const args = {
        accountId: 'account123',
        filter: {
          inMailbox: Common.createId('inbox'),
          after: Common.now()
        },
        sort: [{ property: 'receivedAt', isAscending: false }],
        limit: Common.createUnsignedInt(50),
        calculateTotal: true
      }

      const result = Schema.decodeUnknownSync(EmailQueryArguments)(args)
      expect(result.calculateTotal).toBe(true)
      expect(result.sort).toHaveLength(1)
    })

    it('should validate thread collapse', () => {
      const args = {
        accountId: 'account123',
        collapseThreads: true
      }

      const result = Schema.decodeUnknownSync(EmailQueryArguments)(args)
      expect(result.collapseThreads).toBe(true)
    })
  })
})

describe('EmailHelpers', () => {
  const createTestEmail = (): ReturnType<typeof Schema.decodeUnknownSync<typeof Email>> => {
    const inboxId = Common.createId('inbox')
    const spamId = Common.createId('spam')

    return {
      id: Common.createId('email123'),
      blobId: 'blob123',
      threadId: Common.createId('thread123'),
      mailboxIds: {
        [inboxId]: true,
        [spamId]: false
      },
      keywords: {
        [StandardKeywords.SEEN]: true,
        [StandardKeywords.FLAGGED]: false,
        'custom-label': true
      },
      size: Common.createUnsignedInt(2048),
      receivedAt: Common.now(),
      from: [{ email: 'sender@example.com', name: 'Test Sender' }],
      to: [
        { email: 'recipient1@example.com', name: 'Recipient 1' },
        { email: 'recipient2@example.com' }
      ],
      cc: [{ email: 'cc@example.com' }],
      subject: 'Test Email',
      hasAttachment: true,
      attachments: [
        {
          blobId: 'attachment1',
          type: 'image/png',
          name: 'image.png',
          size: Common.createUnsignedInt(1024),
          isInline: true,
          cid: 'image1@example.com'
        },
        {
          blobId: 'attachment2',
          type: 'application/pdf',
          name: 'document.pdf',
          size: Common.createUnsignedInt(2048)
        }
      ],
      textBody: [
        {
          partId: '1',
          type: 'text/plain',
          size: Common.createUnsignedInt(256)
        }
      ],
      bodyValues: {
        '1': {
          value: 'This is the email content',
          isTruncated: false
        },
        '2': {
          value: '<p>HTML content</p>',
          isTruncated: false
        }
      }
    }
  }

  describe('keyword helpers', () => {
    it('should check if email has keyword', () => {
      const email = createTestEmail()
      expect(EmailHelpers.hasKeyword(email, StandardKeywords.SEEN)).toBe(true)
      expect(EmailHelpers.hasKeyword(email, StandardKeywords.FLAGGED)).toBe(false)
      expect(EmailHelpers.hasKeyword(email, 'nonexistent')).toBe(false)
    })

    it('should check standard keyword states', () => {
      const email = createTestEmail()
      expect(EmailHelpers.isSeen(email)).toBe(true)
      expect(EmailHelpers.isFlagged(email)).toBe(false)
      expect(EmailHelpers.isDraft(email)).toBe(false)
      expect(EmailHelpers.isAnswered(email)).toBe(false)
      expect(EmailHelpers.isForwarded(email)).toBe(false)
    })
  })

  describe('attachment helpers', () => {
    it('should check for attachments', () => {
      const email = createTestEmail()
      expect(EmailHelpers.hasAttachments(email)).toBe(true)
    })

    it('should get inline and regular attachments', () => {
      const email = createTestEmail()
      const inlineAttachments = EmailHelpers.getInlineAttachments(email)
      const regularAttachments = EmailHelpers.getRegularAttachments(email)

      expect(inlineAttachments).toHaveLength(1)
      expect(inlineAttachments[0].name).toBe('image.png')
      expect(regularAttachments).toHaveLength(1)
      expect(regularAttachments[0].name).toBe('document.pdf')
    })
  })

  describe('mailbox helpers', () => {
    it('should get mailbox IDs', () => {
      const email = createTestEmail()
      const mailboxIds = EmailHelpers.getMailboxIds(email)
      expect(mailboxIds).toHaveLength(1) // Only inbox should be true
    })

    it('should check if email is in mailbox', () => {
      const email = createTestEmail()
      // Get the actual mailbox IDs from the email object
      const mailboxIds = Object.keys(email.mailboxIds)
      const inboxId = mailboxIds.find(id => email.mailboxIds[id as any] === true) as any
      const spamId = mailboxIds.find(id => email.mailboxIds[id as any] === false) as any

      expect(EmailHelpers.isInMailbox(email, inboxId)).toBe(true)
      expect(EmailHelpers.isInMailbox(email, spamId)).toBe(false)
    })
  })

  describe('sender/recipient helpers', () => {
    it('should get sender information', () => {
      const email = createTestEmail()
      expect(EmailHelpers.getSenderEmail(email)).toBe('sender@example.com')
      expect(EmailHelpers.getSenderName(email)).toBe('Test Sender')
    })

    it('should get all recipients', () => {
      const email = createTestEmail()
      const recipients = EmailHelpers.getAllRecipients(email)
      expect(recipients).toHaveLength(3) // 2 to + 1 cc
    })
  })

  describe('content helpers', () => {
    it('should check for body types', () => {
      const email = createTestEmail()
      expect(EmailHelpers.hasTextBody(email)).toBe(true)
      expect(EmailHelpers.hasHTMLBody(email)).toBe(false) // No htmlBody in test email
    })

    it('should get text content', () => {
      const email = createTestEmail()
      expect(EmailHelpers.getTextContent(email)).toBe('This is the email content')
    })

    it('should get HTML content', () => {
      const email = {
        ...createTestEmail(),
        htmlBody: [
          {
            partId: '2',
            type: 'text/html',
            size: Common.createUnsignedInt(256)
          }
        ]
      }
      expect(EmailHelpers.getHTMLContent(email)).toBe('<p>HTML content</p>')
    })
  })

  describe('keyword utilities', () => {
    it('should create keywords from array', () => {
      const keywords = EmailHelpers.createKeywords(['$seen', '$flagged', 'important'])
      expect(keywords['$seen']).toBe(true)
      expect(keywords['$flagged']).toBe(true)
      expect(keywords['important']).toBe(true)
    })

    it('should convert keywords to array', () => {
      const keywords = {
        '$seen': true,
        '$flagged': false,
        'important': true
      }
      const keywordArray = EmailHelpers.keywordsToArray(keywords)
      expect(keywordArray).toEqual(['$seen', 'important'])
    })
  })

  describe('new content helpers', () => {
    it('should get formatted content', () => {
      const email = createTestEmail()
      const formattedContent = EmailHelpers.getFormattedContent(email)

      expect(formattedContent.text).toBe('This is the email content')
      expect(formattedContent.html).toBeUndefined() // No HTML body in test email
      expect(formattedContent.hasContent).toBe(true)
      expect(formattedContent.isTruncated).toBe(false)
      expect(formattedContent.hasEncodingProblem).toBe(false)
    })

    it('should get all body content', () => {
      const email = createTestEmail()
      const allContent = EmailHelpers.getAllBodyContent(email)

      expect(allContent['1']).toBeDefined()
      expect(allContent['1'].value).toBe('This is the email content')
      expect(allContent['1'].type).toBe('text/plain')
      expect(allContent['2']).toBeDefined()
      expect(allContent['2'].value).toBe('<p>HTML content</p>')
    })

    it('should handle email with truncated content', () => {
      const email = {
        ...createTestEmail(),
        bodyValues: {
          '1': {
            value: 'Truncated content...',
            isTruncated: true,
            isEncodingProblem: false
          }
        }
      }

      const formattedContent = EmailHelpers.getFormattedContent(email)
      expect(formattedContent.isTruncated).toBe(true)
      expect(formattedContent.hasEncodingProblem).toBe(false)
    })

    it('should handle email with encoding problems', () => {
      const email = {
        ...createTestEmail(),
        bodyValues: {
          '1': {
            value: 'Content with encoding issues',
            isTruncated: false,
            isEncodingProblem: true
          }
        }
      }

      const formattedContent = EmailHelpers.getFormattedContent(email)
      expect(formattedContent.hasEncodingProblem).toBe(true)
    })
  })
})