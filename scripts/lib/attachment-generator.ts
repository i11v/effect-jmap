/**
 * Attachment Generator - Creates placeholder blobs for email attachments
 *
 * Generates deterministic placeholder binary data of specified sizes
 * for testing attachment handling without needing actual files.
 */

import * as crypto from "crypto"
import * as fs from "fs"
import * as path from "path"

/**
 * Attachment metadata for JMAP Email object
 */
export interface AttachmentMetadata {
  blobId: string
  type: string
  name: string
  size: number
  cid?: string // Content-ID for inline attachments
  disposition: "attachment" | "inline"
  isInline: boolean
}

/**
 * Generated blob with data and metadata
 */
export interface GeneratedBlob {
  blobId: string
  data: Buffer
  type: string
  name: string
  size: number
}

/**
 * Generate deterministic placeholder data of specified size
 *
 * Uses a repeating pattern based on the blob ID for reproducibility.
 * The data is deterministic so the same blobId always produces the same content.
 *
 * @param blobId - Blob identifier for deterministic seeding
 * @param size - Size in bytes
 * @returns Buffer containing placeholder data
 */
export const generatePlaceholderData = (blobId: string, size: number): Buffer => {
  // Create a deterministic seed based on blobId
  const seed = crypto.createHash("sha256").update(blobId).digest()

  // For small sizes, just use random bytes with deterministic seed
  if (size <= 1024) {
    const buffer = Buffer.alloc(size)
    for (let i = 0; i < size; i++) {
      buffer[i] = seed[i % seed.length]!
    }
    return buffer
  }

  // For larger sizes, use a repeating pattern to be memory efficient
  const chunkSize = Math.min(8192, size)
  const chunk = Buffer.alloc(chunkSize)

  for (let i = 0; i < chunkSize; i++) {
    chunk[i] = seed[i % seed.length]!
  }

  // Build the full buffer by repeating the chunk
  const buffer = Buffer.alloc(size)
  let offset = 0

  while (offset < size) {
    const remaining = size - offset
    const toCopy = Math.min(chunkSize, remaining)
    chunk.copy(buffer, offset, 0, toCopy)
    offset += toCopy
  }

  return buffer
}

/**
 * Generate a placeholder PDF header to make the blob look like a PDF
 *
 * @param blobId - Blob identifier
 * @param size - Total size of the blob
 * @returns Buffer with PDF-like structure
 */
const generatePdfPlaceholder = (blobId: string, size: number): Buffer => {
  const header = Buffer.from("%PDF-1.4\n")
  const footer = Buffer.from("\n%%EOF\n")

  if (size <= header.length + footer.length) {
    return generatePlaceholderData(blobId, size)
  }

  const fillSize = size - header.length - footer.length
  const fill = generatePlaceholderData(blobId, fillSize)

  return Buffer.concat([header, fill, footer])
}

/**
 * Generate a placeholder PNG header to make the blob look like a PNG
 *
 * @param blobId - Blob identifier
 * @param size - Total size of the blob
 * @returns Buffer with PNG-like structure
 */
const generatePngPlaceholder = (blobId: string, size: number): Buffer => {
  // PNG magic number
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  if (size <= header.length) {
    return header.slice(0, size)
  }

  const fill = generatePlaceholderData(blobId, size - header.length)
  return Buffer.concat([header, fill])
}

/**
 * Generate a placeholder JPEG header to make the blob look like a JPEG
 *
 * @param blobId - Blob identifier
 * @param size - Total size of the blob
 * @returns Buffer with JPEG-like structure
 */
const generateJpegPlaceholder = (blobId: string, size: number): Buffer => {
  // JPEG magic number (Start of Image + JFIF marker)
  const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0])

  if (size <= header.length + 2) {
    return size <= header.length
      ? header.slice(0, size)
      : Buffer.concat([header, generatePlaceholderData(blobId, size - header.length)])
  }

  // JPEG End of Image marker
  const footer = Buffer.from([0xff, 0xd9])
  const fillSize = size - header.length - footer.length
  const fill = generatePlaceholderData(blobId, fillSize)

  return Buffer.concat([header, fill, footer])
}

/**
 * Generate placeholder blob data based on MIME type
 *
 * @param blobId - Blob identifier for deterministic generation
 * @param mimeType - MIME type of the attachment
 * @param size - Size in bytes
 * @returns Buffer containing appropriate placeholder data
 */
export const generateBlobData = (
  blobId: string,
  mimeType: string,
  size: number
): Buffer => {
  const lowerType = mimeType.toLowerCase()

  if (lowerType === "application/pdf") {
    return generatePdfPlaceholder(blobId, size)
  }

  if (lowerType === "image/png" || lowerType === "image/svg+xml") {
    return generatePngPlaceholder(blobId, size)
  }

  if (lowerType === "image/jpeg" || lowerType === "image/jpg") {
    return generateJpegPlaceholder(blobId, size)
  }

  // For other types, just use generic placeholder data
  return generatePlaceholderData(blobId, size)
}

/**
 * Generate a complete blob with metadata
 *
 * @param blobId - Blob identifier
 * @param mimeType - MIME type
 * @param name - Filename
 * @param size - Size in bytes
 * @returns Generated blob with data and metadata
 */
export const generateBlob = (
  blobId: string,
  mimeType: string,
  name: string,
  size: number
): GeneratedBlob => {
  return {
    blobId,
    data: generateBlobData(blobId, mimeType, size),
    type: mimeType,
    name,
    size,
  }
}

/**
 * Write blobs to the filesystem for seeding
 *
 * @param blobs - Array of generated blobs
 * @param outputDir - Directory to write blobs to
 */
export const writeBlobsToDir = async (
  blobs: GeneratedBlob[],
  outputDir: string
): Promise<void> => {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write each blob
  for (const blob of blobs) {
    const filePath = path.join(outputDir, `${blob.blobId}.bin`)
    fs.writeFileSync(filePath, blob.data)
  }
}

/**
 * Create inline image metadata
 *
 * @param blobId - Blob identifier
 * @param contentId - Content-ID for referencing in HTML
 * @param index - Image index
 * @returns Attachment metadata for inline image
 */
export const createInlineImageMetadata = (
  blobId: string,
  contentId: string,
  index: number
): AttachmentMetadata => {
  return {
    blobId,
    type: "image/png",
    name: `inline-image-${index + 1}.png`,
    size: 50 * 1024, // 50KB default for inline images
    cid: contentId,
    disposition: "inline",
    isInline: true,
  }
}

/**
 * Create regular attachment metadata
 *
 * @param blobId - Blob identifier
 * @param type - MIME type
 * @param name - Filename
 * @param size - Size in bytes
 * @returns Attachment metadata
 */
export const createAttachmentMetadata = (
  blobId: string,
  type: string,
  name: string,
  size: number
): AttachmentMetadata => {
  return {
    blobId,
    type,
    name,
    size,
    disposition: "attachment",
    isInline: false,
  }
}
