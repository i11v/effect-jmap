import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import {
  MimeTypes,
  KeywordUtils,
  BodyUtils,
  AttachmentUtils,
  HTMLUtils,
  BinaryUtils,
  EmailProcessing
} from '../../../src/core/EmailUtils.ts'
import { Email, EmailBodyPart, EmailAttachment } from '../../../src/schemas/Email.ts'
import { Common, StandardKeywords } from '../../../src/schemas/Common.ts'

describe('EmailUtils', () => {
  describe('MimeTypes', () => {
    it('should identify MIME type categories', () => {
      expect(MimeTypes.isText('text/plain')).toBe(true)
      expect(MimeTypes.isText('text/html')).toBe(true)
      expect(MimeTypes.isText('application/pdf')).toBe(false)

      expect(MimeTypes.isImage('image/png')).toBe(true)
      expect(MimeTypes.isImage('image/jpeg')).toBe(true)
      expect(MimeTypes.isImage('text/plain')).toBe(false)

      expect(MimeTypes.isApplication('application/pdf')).toBe(true)
      expect(MimeTypes.isApplication('application/json')).toBe(true)
      expect(MimeTypes.isApplication('text/plain')).toBe(false)

      expect(MimeTypes.isMultipart('multipart/mixed')).toBe(true)
      expect(MimeTypes.isMultipart('multipart/alternative')).toBe(true)
      expect(MimeTypes.isMultipart('text/plain')).toBe(false)
    })

    it('should extract MIME type components', () => {
      expect(MimeTypes.getMainType('text/html')).toBe('text')
      expect(MimeTypes.getSubType('text/html')).toBe('html')

      expect(MimeTypes.getMainType('application/pdf')).toBe('application')
      expect(MimeTypes.getSubType('application/pdf')).toBe('pdf')
    })
  })

  describe('KeywordUtils', () => {
    const keywords1 = {
      [StandardKeywords.SEEN]: true,
      [StandardKeywords.FLAGGED]: false,
      'custom1': true
    }

    const keywords2 = {
      [StandardKeywords.FLAGGED]: true,
      'custom2': true
    }

    it('should merge keywords', () => {
      const merged = KeywordUtils.merge(keywords1, keywords2)

      expect(merged[StandardKeywords.SEEN]).toBe(true)
      expect(merged[StandardKeywords.FLAGGED]).toBe(true)
      expect(merged['custom1']).toBe(true)
      expect(merged['custom2']).toBe(true)
    })

    it('should add keywords', () => {
      const result = KeywordUtils.add(keywords1, ['new1', 'new2'])

      expect(result['new1']).toBe(true)
      expect(result['new2']).toBe(true)
      expect(result[StandardKeywords.SEEN]).toBe(true)
    })

    it('should remove keywords', () => {
      const result = KeywordUtils.remove(keywords1, ['custom1'])

      expect(result['custom1']).toBeUndefined()
      expect(result[StandardKeywords.SEEN]).toBe(true)
    })

    it('should toggle keywords', () => {
      const result = KeywordUtils.toggle(keywords1, StandardKeywords.FLAGGED)
      expect(result[StandardKeywords.FLAGGED]).toBe(true)

      const result2 = KeywordUtils.toggle(result, StandardKeywords.FLAGGED)
      expect(result2[StandardKeywords.FLAGGED]).toBe(false)
    })

    it('should get active keywords', () => {
      const active = KeywordUtils.getActive(keywords1)
      expect(active).toEqual([StandardKeywords.SEEN, 'custom1'])
    })

    it('should check keyword presence', () => {
      expect(KeywordUtils.has(keywords1, StandardKeywords.SEEN)).toBe(true)
      expect(KeywordUtils.has(keywords1, StandardKeywords.FLAGGED)).toBe(false)
      expect(KeywordUtils.has(keywords1, 'nonexistent')).toBe(false)
    })

    it('should create keywords from array', () => {
      const keywords = KeywordUtils.fromArray(['$seen', '$flagged', 'important'])
      expect(keywords['$seen']).toBe(true)
      expect(keywords['$flagged']).toBe(true)
      expect(keywords['important']).toBe(true)
    })

    it('should count active keywords', () => {
      expect(KeywordUtils.count(keywords1)).toBe(2) // $seen and custom1
      expect(KeywordUtils.count(KeywordUtils.empty())).toBe(0)
    })
  })

  describe('BodyUtils', () => {
    const bodyParts: EmailBodyPart[] = [
      {
        partId: '1',
        type: 'text/plain',
        size: Common.createUnsignedInt(256)
      },
      {
        partId: '2',
        type: 'text/html',
        size: Common.createUnsignedInt(512)
      },
      {
        partId: '3',
        type: 'image/png',
        disposition: 'attachment',
        name: 'image.png',
        size: Common.createUnsignedInt(1024)
      }
    ]

    it('should find text content', () => {
      const textPart = BodyUtils.findTextContent(bodyParts)
      expect(textPart?.partId).toBe('1')
      expect(textPart?.type).toBe('text/plain')
    })

    it('should find HTML content', () => {
      const htmlPart = BodyUtils.findHTMLContent(bodyParts)
      expect(htmlPart?.partId).toBe('2')
      expect(htmlPart?.type).toBe('text/html')
    })

    it('should get all text parts', () => {
      const textParts = BodyUtils.getTextParts(bodyParts)
      expect(textParts).toHaveLength(2)
      expect(textParts.map(p => p.type)).toEqual(['text/plain', 'text/html'])
    })

    it('should get attachment parts', () => {
      const attachmentParts = BodyUtils.getAttachmentParts(bodyParts)
      expect(attachmentParts).toHaveLength(1)
      expect(attachmentParts[0].name).toBe('image.png')
    })

    it('should flatten nested parts', () => {
      const nestedParts: EmailBodyPart[] = [
        {
          type: 'multipart/mixed',
          subParts: [
            { partId: '1.1', type: 'text/plain', size: Common.createUnsignedInt(100) },
            { partId: '1.2', type: 'text/html', size: Common.createUnsignedInt(200) }
          ]
        },
        { partId: '2', type: 'image/png', size: Common.createUnsignedInt(300) }
      ]

      const flattened = BodyUtils.flattenParts(nestedParts)
      expect(flattened).toHaveLength(4) // parent + 2 children + 1 sibling
    })

    it('should extract content by part ID', () => {
      const bodyValues = {
        '1': { value: 'Plain text content', isTruncated: false },
        '2': { value: '<p>HTML content</p>', isTruncated: false }
      }

      expect(BodyUtils.getContentByPartId(bodyValues, '1')).toBe('Plain text content')
      expect(BodyUtils.getContentByPartId(bodyValues, '2')).toBe('<p>HTML content</p>')
      expect(BodyUtils.getContentByPartId(bodyValues, 'nonexistent')).toBeUndefined()
    })

    it('should check truncation status', () => {
      const bodyValues = {
        '1': { value: 'Full content', isTruncated: false },
        '2': { value: 'Truncated...', isTruncated: true }
      }

      expect(BodyUtils.isTruncated(bodyValues, '1')).toBe(false)
      expect(BodyUtils.isTruncated(bodyValues, '2')).toBe(true)
    })

    it('should check encoding problems', () => {
      const bodyValues = {
        '1': { value: 'Good content', isEncodingProblem: false },
        '2': { value: 'Bad encoding', isEncodingProblem: true }
      }

      expect(BodyUtils.hasEncodingProblem(bodyValues, '1')).toBe(false)
      expect(BodyUtils.hasEncodingProblem(bodyValues, '2')).toBe(true)
    })
  })

  describe('AttachmentUtils', () => {
    const attachments: EmailAttachment[] = [
      {
        blobId: 'blob1',
        type: 'image/png',
        name: 'image.png',
        size: Common.createUnsignedInt(1024)
      },
      {
        blobId: 'blob2',
        type: 'application/pdf',
        name: 'document.pdf',
        size: Common.createUnsignedInt(2048)
      },
      {
        blobId: 'blob3',
        type: 'image/jpeg',
        name: 'photo.jpg',
        size: Common.createUnsignedInt(3072),
        isInline: true,
        cid: 'photo@example.com'
      }
    ]

    it('should filter by type', () => {
      const pngAttachments = AttachmentUtils.filterByType(attachments, 'image/png')
      expect(pngAttachments).toHaveLength(1)
      expect(pngAttachments[0].name).toBe('image.png')
    })

    it('should get images', () => {
      const images = AttachmentUtils.getImages(attachments)
      expect(images).toHaveLength(2)
      expect(images.map(i => i.name)).toEqual(['image.png', 'photo.jpg'])
    })

    it('should get documents', () => {
      const documents = AttachmentUtils.getDocuments(attachments)
      expect(documents).toHaveLength(1)
      expect(documents[0].name).toBe('document.pdf')
    })

    it('should get inline attachments', () => {
      const inline = AttachmentUtils.getInline(attachments)
      expect(inline).toHaveLength(1)
      expect(inline[0].name).toBe('photo.jpg')
    })

    it('should get regular attachments', () => {
      const regular = AttachmentUtils.getRegular(attachments)
      expect(regular).toHaveLength(2)
      expect(regular.map(a => a.name)).toEqual(['image.png', 'document.pdf'])
    })

    it('should calculate total size', () => {
      const totalSize = AttachmentUtils.getTotalSize(attachments)
      expect(totalSize).toBe(6144) // 1024 + 2048 + 3072
    })

    it('should format sizes', () => {
      expect(AttachmentUtils.formatSize(1024)).toBe('1 KB')
      expect(AttachmentUtils.formatSize(1048576)).toBe('1 MB')
      expect(AttachmentUtils.formatSize(500)).toBe('500 B')
    })

    it('should check safe inline display', () => {
      expect(AttachmentUtils.isSafeForInlineDisplay(attachments[0])).toBe(true) // PNG
      expect(AttachmentUtils.isSafeForInlineDisplay(attachments[1])).toBe(false) // PDF
      expect(AttachmentUtils.isSafeForInlineDisplay(attachments[2])).toBe(true) // JPEG
    })
  })

  describe('HTMLUtils', () => {
    const htmlContent = `
      <html>
        <body>
          <h1>Hello World</h1>
          <p>This is a <strong>test</strong> email.</p>
          <script>alert('malicious')</script>
          <a href="https://example.com">External Link</a>
          <a href="relative.html">Relative Link</a>
          <img src="image.png" alt="Test Image" title="Image Title">
          <img src="/absolute/image.jpg" alt="Absolute Image">
        </body>
      </html>
    `

    it('should strip HTML tags', () => {
      const text = HTMLUtils.stripTags('<p>Hello <strong>world</strong>!</p>')
      expect(text).toBe('Hello world!')
    })

    it('should extract text content', () => {
      const text = HTMLUtils.extractText('<p>Hello&nbsp;<strong>world</strong>!</p>')
      expect(text).toBe('Hello world!')
    })

    it('should decode HTML entities', () => {
      const text = HTMLUtils.extractText('&lt;tag&gt; &amp; &quot;quotes&quot;')
      expect(text).toBe('<tag> & "quotes"')
    })

    it('should sanitize HTML', () => {
      const sanitized = HTMLUtils.sanitize(htmlContent)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).toContain('<h1>')
      expect(sanitized).toContain('<p>')
    })

    it('should remove javascript URLs', () => {
      const html = '<a href="javascript:alert(\'xss\')">Click</a>'
      const sanitized = HTMLUtils.sanitize(html)
      expect(sanitized).not.toContain('javascript:')
    })

    it('should convert relative URLs', () => {
      const baseUrl = 'https://example.com/path/'
      const converted = HTMLUtils.convertRelativeUrls(htmlContent, baseUrl)

      expect(converted).toContain('src="https://example.com/path/image.png"')
      expect(converted).toContain('href="https://example.com/path/relative.html"')
      expect(converted).toContain('href="https://example.com"') // Absolute URLs unchanged
    })

    it('should extract links', () => {
      const links = HTMLUtils.extractLinks(htmlContent)
      expect(links).toHaveLength(2)
      expect(links[0]).toEqual({ url: 'https://example.com', text: 'External Link' })
      expect(links[1]).toEqual({ url: 'relative.html', text: 'Relative Link' })
    })

    it('should extract images', () => {
      const images = HTMLUtils.extractImages(htmlContent)
      expect(images).toHaveLength(2)
      expect(images[0]).toEqual({
        src: 'image.png',
        alt: 'Test Image',
        title: 'Image Title'
      })
      expect(images[1]).toEqual({
        src: '/absolute/image.jpg',
        alt: 'Absolute Image',
        title: undefined
      })
    })
  })

  describe('BinaryUtils', () => {
    const testData = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"

    it('should convert to/from base64', () => {
      const base64 = BinaryUtils.toBase64(testData)
      expect(base64).toBe('SGVsbG8=')

      const restored = BinaryUtils.fromBase64(base64)
      expect(Array.from(restored)).toEqual([72, 101, 108, 108, 111])
    })

    it('should detect MIME types from binary data', () => {
      // PNG signature
      const pngData = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      expect(BinaryUtils.detectMimeType(pngData)).toBe('image/png')

      // JPEG signature
      const jpegData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])
      expect(BinaryUtils.detectMimeType(jpegData)).toBe('image/jpeg')

      // GIF signature
      const gifData = new Uint8Array([0x47, 0x49, 0x46, 0x38])
      expect(BinaryUtils.detectMimeType(gifData)).toBe('image/gif')

      // PDF signature
      const pdfData = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D])
      expect(BinaryUtils.detectMimeType(pdfData)).toBe('application/pdf')

      // Unknown data
      expect(BinaryUtils.detectMimeType(testData)).toBe('application/octet-stream')
    })

    it('should calculate checksums', () => {
      const checksum = BinaryUtils.calculateChecksum(testData)
      expect(checksum).toMatch(/^[0-9a-f]{4}$/)

      // Same data should produce same checksum
      const checksum2 = BinaryUtils.calculateChecksum(testData)
      expect(checksum).toBe(checksum2)
    })
  })

  describe('EmailProcessing', () => {
    const createTestEmail = (): Email => ({
      id: Common.createId('email1'),
      blobId: 'blob1',
      threadId: Common.createId('thread1'),
      mailboxIds: { [Common.createId('inbox')]: true },
      size: Common.createUnsignedInt(1024),
      receivedAt: Common.now(),
      subject: 'Test Email Subject',
      textBody: [
        { partId: '1', type: 'text/plain', size: Common.createUnsignedInt(256) }
      ],
      htmlBody: [
        { partId: '2', type: 'text/html', size: Common.createUnsignedInt(512) }
      ],
      bodyValues: {
        '1': { value: 'This is the plain text content of the email.', isTruncated: false },
        '2': { value: '<p>This is <strong>HTML</strong> content.</p>', isTruncated: false }
      }
    } as Email)

    it('should extract all text content', () => {
      const email = createTestEmail()
      const result = Effect.runSync(EmailProcessing.extractAllText(email))

      expect(result).toContain('Subject: Test Email Subject')
      expect(result).toContain('This is the plain text content of the email.')
    })

    it('should extract HTML as text when no plain text', () => {
      const email = createTestEmail()
      delete email.textBody
      delete email.bodyValues!['1']

      const result = Effect.runSync(EmailProcessing.extractAllText(email))
      expect(result).toContain('This is HTML content.') // HTML stripped
    })

    it('should get email summary', () => {
      const email = createTestEmail()
      const result = Effect.runSync(EmailProcessing.getSummary(email, 50))

      expect(result).toContain('Subject: Test Email Subject')
      expect(result.length).toBeLessThanOrEqual(53) // 50 + '...'
      expect(result).toMatch(/\.\.\.$/) // Should end with ...
    })

    it('should detect likely spam', () => {
      const spamEmail = createTestEmail()
      spamEmail.subject = '$$$ FREE MONEY URGENT ACT NOW! $$$'

      expect(EmailProcessing.isLikelySpam(spamEmail)).toBe(true)

      const normalEmail = createTestEmail()
      normalEmail.subject = 'Meeting reminder for tomorrow'

      expect(EmailProcessing.isLikelySpam(normalEmail)).toBe(false)
    })

    it('should detect excessive caps as spam indicator', () => {
      const capsEmail = createTestEmail()
      capsEmail.subject = 'URGENT IMPORTANT MESSAGE FOR YOU'

      expect(EmailProcessing.isLikelySpam(capsEmail)).toBe(false) // Only one indicator

      // Add another spam indicator
      capsEmail.subject = '$$$ URGENT IMPORTANT MESSAGE FOR YOU $$$'
      expect(EmailProcessing.isLikelySpam(capsEmail)).toBe(true) // Multiple indicators
    })
  })
})