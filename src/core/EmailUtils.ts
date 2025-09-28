import { Effect, Data } from 'effect'
import { Email, EmailBodyPart, EmailAttachment, EmailBodyValues } from '../schemas/Email.ts'
import { Keywords } from '../schemas/Common.ts'

/**
 * Email Utilities for advanced email processing
 */

/**
 * MIME Type utilities
 */
export const MimeTypes = {
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  MULTIPART_MIXED: 'multipart/mixed',
  MULTIPART_ALTERNATIVE: 'multipart/alternative',
  MULTIPART_RELATED: 'multipart/related',
  APPLICATION_OCTET_STREAM: 'application/octet-stream',
  IMAGE_PNG: 'image/png',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_GIF: 'image/gif',
  APPLICATION_PDF: 'application/pdf',

  isText: (mimeType: string): boolean =>
    mimeType.startsWith('text/'),

  isImage: (mimeType: string): boolean =>
    mimeType.startsWith('image/'),

  isApplication: (mimeType: string): boolean =>
    mimeType.startsWith('application/'),

  isMultipart: (mimeType: string): boolean =>
    mimeType.startsWith('multipart/'),

  getMainType: (mimeType: string): string =>
    mimeType.split('/')[0] || '',

  getSubType: (mimeType: string): string =>
    mimeType.split('/')[1] || ''
} as const

/**
 * Keyword management utilities
 */
export const KeywordUtils = {
  /**
   * Merge two keyword objects
   */
  merge: (keywords1: Keywords, keywords2: Keywords): Keywords => ({
    ...keywords1,
    ...keywords2
  }),

  /**
   * Add keywords to existing set
   */
  add: (existing: Keywords, toAdd: string[]): Keywords => {
    const result = { ...existing }
    for (const keyword of toAdd) {
      result[keyword] = true
    }
    return result
  },

  /**
   * Remove keywords from existing set
   */
  remove: (existing: Keywords, toRemove: string[]): Keywords => {
    const result = { ...existing }
    for (const keyword of toRemove) {
      delete result[keyword]
    }
    return result
  },

  /**
   * Toggle keyword state
   */
  toggle: (existing: Keywords, keyword: string): Keywords => ({
    ...existing,
    [keyword]: !existing[keyword]
  }),

  /**
   * Get active keywords as array
   */
  getActive: (keywords: Keywords): string[] =>
    Object.entries(keywords)
      .filter(([_, active]) => active)
      .map(([keyword, _]) => keyword),

  /**
   * Check if keyword is active
   */
  has: (keywords: Keywords, keyword: string): boolean =>
    Boolean(keywords[keyword]),

  /**
   * Create keywords from array
   */
  fromArray: (keywordArray: string[]): Keywords =>
    keywordArray.reduce((acc, keyword) => ({ ...acc, [keyword]: true }), {} as Keywords),

  /**
   * Create empty keywords object
   */
  empty: (): Keywords => ({}),

  /**
   * Count active keywords
   */
  count: (keywords: Keywords): number =>
    Object.values(keywords).filter(Boolean).length
}

/**
 * Email body parsing utilities
 */
export const BodyUtils = {
  /**
   * Find the main text content in body parts
   */
  findTextContent: (bodyParts: EmailBodyPart[]): EmailBodyPart | undefined =>
    bodyParts.find(part => part.type === MimeTypes.TEXT_PLAIN),

  /**
   * Find the main HTML content in body parts
   */
  findHTMLContent: (bodyParts: EmailBodyPart[]): EmailBodyPart | undefined =>
    bodyParts.find(part => part.type === MimeTypes.TEXT_HTML),

  /**
   * Get all text parts
   */
  getTextParts: (bodyParts: EmailBodyPart[]): EmailBodyPart[] =>
    bodyParts.filter(part => part.type && MimeTypes.isText(part.type)),

  /**
   * Get all attachment parts
   */
  getAttachmentParts: (bodyParts: EmailBodyPart[]): EmailBodyPart[] =>
    bodyParts.filter(part =>
      part.disposition === 'attachment' ||
      (part.type && !MimeTypes.isText(part.type))
    ),

  /**
   * Flatten nested body parts
   */
  flattenParts: (bodyParts: EmailBodyPart[]): EmailBodyPart[] => {
    const result: EmailBodyPart[] = []

    const traverse = (parts: EmailBodyPart[]) => {
      for (const part of parts) {
        result.push(part)
        if (part.subParts) {
          traverse(part.subParts)
        }
      }
    }

    traverse(bodyParts)
    return result
  },

  /**
   * Extract body content by part ID
   */
  getContentByPartId: (bodyValues: EmailBodyValues, partId: string): string | undefined => {
    const content = bodyValues[partId]
    return content?.value
  },

  /**
   * Check if content is truncated
   */
  isTruncated: (bodyValues: EmailBodyValues, partId: string): boolean => {
    const content = bodyValues[partId]
    return content?.isTruncated === true
  },

  /**
   * Check if content has encoding problems
   */
  hasEncodingProblem: (bodyValues: EmailBodyValues, partId: string): boolean => {
    const content = bodyValues[partId]
    return content?.isEncodingProblem === true
  }
}

/**
 * Attachment utilities
 */
export const AttachmentUtils = {
  /**
   * Filter attachments by type
   */
  filterByType: (attachments: EmailAttachment[], mimeType: string): EmailAttachment[] =>
    attachments.filter(att => att.type === mimeType),

  /**
   * Get image attachments
   */
  getImages: (attachments: EmailAttachment[]): EmailAttachment[] =>
    attachments.filter(att => MimeTypes.isImage(att.type)),

  /**
   * Get document attachments
   */
  getDocuments: (attachments: EmailAttachment[]): EmailAttachment[] =>
    attachments.filter(att => MimeTypes.isApplication(att.type)),

  /**
   * Get inline attachments (embedded content)
   */
  getInline: (attachments: EmailAttachment[]): EmailAttachment[] =>
    attachments.filter(att => att.isInline === true || att.cid !== undefined),

  /**
   * Get regular attachments (non-inline)
   */
  getRegular: (attachments: EmailAttachment[]): EmailAttachment[] =>
    attachments.filter(att => att.isInline !== true && att.cid === undefined),

  /**
   * Calculate total attachment size
   */
  getTotalSize: (attachments: EmailAttachment[]): number =>
    attachments.reduce((total, att) => total + att.size, 0),

  /**
   * Format attachment size for display
   */
  formatSize: (sizeInBytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = sizeInBytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
  },

  /**
   * Check if attachment is safe to display inline
   */
  isSafeForInlineDisplay: (attachment: EmailAttachment): boolean => {
    const safeMimeTypes = [
      MimeTypes.IMAGE_PNG,
      MimeTypes.IMAGE_JPEG,
      MimeTypes.IMAGE_GIF,
      MimeTypes.TEXT_PLAIN
    ]
    return safeMimeTypes.includes(attachment.type as any)
  }
}

/**
 * HTML sanitization utilities
 */
export const HTMLUtils = {
  /**
   * Strip HTML tags from content
   */
  stripTags: (html: string): string =>
    html.replace(/<[^>]*>/g, ''),

  /**
   * Extract text content from HTML
   */
  extractText: (html: string): string =>
    HTMLUtils.stripTags(html)
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/\s+/g, ' ')
      .trim(),

  /**
   * Basic HTML sanitization (remove potentially dangerous elements)
   */
  sanitize: (html: string): string => {
    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // Remove event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '')

    // Remove data: URLs (can be dangerous)
    sanitized = sanitized.replace(/data:/gi, '')

    return sanitized
  },

  /**
   * Convert relative URLs to absolute
   */
  convertRelativeUrls: (html: string, baseUrl: string): string => {
    if (!baseUrl) return html

    // Convert relative src attributes
    let result = html.replace(
      /src\s*=\s*["'](?!https?:\/\/|\/\/|data:|mailto:|#)([^"']+)["']/gi,
      `src="${baseUrl}$1"`
    )

    // Convert relative href attributes
    result = result.replace(
      /href\s*=\s*["'](?!https?:\/\/|\/\/|mailto:|#)([^"']+)["']/gi,
      `href="${baseUrl}$1"`
    )

    return result
  },

  /**
   * Extract links from HTML content
   */
  extractLinks: (html: string): Array<{ url: string; text: string }> => {
    const links: Array<{ url: string; text: string }> = []
    const linkRegex = /<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi

    let match
    while ((match = linkRegex.exec(html)) !== null) {
      if (match[1] && match[2]) {
        links.push({
          url: match[1],
          text: HTMLUtils.stripTags(match[2]).trim()
        })
      }
    }

    return links
  },

  /**
   * Extract images from HTML content
   */
  extractImages: (html: string): Array<{ src: string; alt: string; title?: string }> => {
    const images: Array<{ src: string; alt: string; title?: string }> = []
    const imgRegex = /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi

    let match
    while ((match = imgRegex.exec(html)) !== null) {
      if (!match[1]) continue

      const imgTag = match[0]
      const src = match[1]

      // Extract alt attribute
      const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i)
      const alt = altMatch && altMatch[1] ? altMatch[1] : ''

      // Extract title attribute
      const titleMatch = imgTag.match(/title\s*=\s*["']([^"']*)["']/i)
      const title = titleMatch && titleMatch[1] ? titleMatch[1] : undefined

      images.push({
        src,
        alt,
        ...(title !== undefined && { title })
      })
    }

    return images
  }
}

/**
 * Binary data handling utilities
 */
export const BinaryUtils = {
  /**
   * Convert binary data to base64
   */
  toBase64: (data: Uint8Array): string =>
    btoa(String.fromCharCode(...data)),

  /**
   * Convert base64 to binary data
   */
  fromBase64: (base64: string): Uint8Array => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  },

  /**
   * Get MIME type from binary data (basic detection)
   */
  detectMimeType: (data: Uint8Array): string => {
    if (data.length < 4) return MimeTypes.APPLICATION_OCTET_STREAM

    // PNG
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
      return MimeTypes.IMAGE_PNG
    }

    // JPEG
    if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
      return MimeTypes.IMAGE_JPEG
    }

    // GIF
    if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
      return MimeTypes.IMAGE_GIF
    }

    // PDF
    if (data.length >= 5 &&
        data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) {
      return MimeTypes.APPLICATION_PDF
    }

    return MimeTypes.APPLICATION_OCTET_STREAM
  },

  /**
   * Calculate checksum of binary data
   */
  calculateChecksum: (data: Uint8Array): string => {
    let checksum = 0
    for (const byte of data) {
      checksum = (checksum + byte) & 0xFFFF
    }
    return checksum.toString(16).padStart(4, '0')
  }
}

/**
 * Email processing error types
 */
export class EmailProcessingError extends Data.TaggedError('EmailProcessingError')<{
  message: string
  cause?: unknown
}> {}

/**
 * Advanced email processing utilities
 */
export const EmailProcessing = {
  /**
   * Extract all text content from an email
   */
  extractAllText: (email: Email): Effect.Effect<string, EmailProcessingError> =>
    Effect.gen(function* () {
      const textParts: string[] = []

      // Add subject
      if (email.subject) {
        textParts.push(`Subject: ${email.subject}`)
      }

      // Add body text
      if (email.bodyValues && email.textBody) {
        for (const part of email.textBody) {
          const bodyPart = part as any // Type assertion for body part
          if (bodyPart.partId && email.bodyValues[bodyPart.partId]) {
            const bodyValue = email.bodyValues[bodyPart.partId]
            if (bodyValue?.value) {
              const content = bodyValue.value
              textParts.push(content)
            }
          }
        }
      }

      // If no text body, try to extract from HTML body
      if (textParts.length <= 1 && email.bodyValues && email.htmlBody) {
        for (const part of email.htmlBody) {
          const bodyPart = part as any // Type assertion for body part
          if (bodyPart.partId && email.bodyValues[bodyPart.partId]) {
            const bodyValue = email.bodyValues[bodyPart.partId]
            if (bodyValue?.value) {
              const content = bodyValue.value
              textParts.push(HTMLUtils.extractText(content))
            }
          }
        }
      }

      return textParts.join('\n\n')
    }),

  /**
   * Get email summary
   */
  getSummary: (email: Email, maxLength: number = 200): Effect.Effect<string, EmailProcessingError> =>
    Effect.gen(function* () {
      const fullText = yield* EmailProcessing.extractAllText(email)

      if (fullText.length <= maxLength) {
        return fullText
      }

      // Try to cut at a word boundary
      const truncated = fullText.substring(0, maxLength)
      const lastSpace = truncated.lastIndexOf(' ')

      if (lastSpace > maxLength * 0.8) {
        return truncated.substring(0, lastSpace) + '...'
      }

      return truncated + '...'
    }),

  /**
   * Check if email is spam-like (basic heuristics)
   */
  isLikelySpam: (email: Email): boolean => {
    const indicators: string[] = []

    // Check subject for spam indicators
    const spamSubjectPatterns = [
      /\$\$\$/,
      /FREE!/i,
      /URGENT!/i,
      /ACT NOW!/i,
      /LIMITED TIME!/i,
      /CONGRATULATIONS!/i
    ]

    if (email.subject) {
      for (const pattern of spamSubjectPatterns) {
        if (pattern.test(email.subject)) {
          indicators.push('suspicious_subject')
          break
        }
      }

      // Check for excessive caps (only count letters)
      if (email.subject.length > 10) {
        const letters = email.subject.replace(/[^A-Za-z]/g, '')
        if (letters.length > 0) {
          const capsRatio = (letters.match(/[A-Z]/g) || []).length / letters.length
          if (capsRatio > 0.6) {
            indicators.push('excessive_caps')
          }
        }
      }
    }

    // Return true if multiple indicators found
    return indicators.length >= 2
  }
}