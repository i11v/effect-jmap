/**
 * Spec File Parser
 *
 * Parses JMAP specification markdown files to extract test cases.
 * Each spec file contains:
 * - H1 heading with the method name (e.g., "# Mailbox/get")
 * - H2 headings with test case names (e.g., "## Basic mailbox retrieval")
 * - JSON code blocks with requests and responses (response marked with `// response`)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { JMAPMethod } from '../config/capabilities.js'

/**
 * Represents a parsed JSON request/response pair
 */
export interface RequestResponsePair {
  request: Record<string, unknown>
  response?: Record<string, unknown>
}

/**
 * Represents a single test case extracted from a spec file
 */
export interface SpecTestCase {
  /** Test case name from H2 heading */
  name: string
  /** Description text between heading and first code block */
  description: string
  /** Request/response pairs in this test case */
  pairs: RequestResponsePair[]
  /** Sub-test cases (H3 headings within this H2) */
  subCases: SpecTestCase[]
  /** Line number where this test case starts */
  lineNumber: number
}

/**
 * Represents a parsed spec file
 */
export interface ParsedSpec {
  /** JMAP method name from H1 heading */
  method: string
  /** File path of the spec */
  filePath: string
  /** Description from the first paragraph after H1 */
  description: string
  /** Test cases from H2 headings */
  testCases: SpecTestCase[]
}

/**
 * Parse a JSON code block, handling comments
 */
function parseJsonBlock(content: string): Record<string, unknown> | null {
  try {
    // Remove JavaScript-style comments
    const cleanedContent = content
      .split('\n')
      .map(line => {
        // Remove // comments (but preserve strings containing //)
        const commentIndex = line.indexOf('//')
        if (commentIndex === -1) return line
        // Simple check: if // appears, remove it and everything after
        // This is a simplification - proper parsing would need to track string state
        return line.substring(0, commentIndex)
      })
      .join('\n')
      .trim()

    if (!cleanedContent) return null
    return JSON.parse(cleanedContent)
  } catch {
    return null
  }
}

/**
 * Extract JSON code blocks from a section of markdown
 */
function extractJsonBlocks(content: string): { json: string; isResponse: boolean }[] {
  const blocks: { json: string; isResponse: boolean }[] = []
  const codeBlockRegex = /```json\s*\n([\s\S]*?)```/g

  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const blockContent = match[1]
    const isResponse = blockContent.trim().startsWith('// response')
    blocks.push({
      json: blockContent,
      isResponse
    })
  }

  return blocks
}

/**
 * Group JSON blocks into request/response pairs
 */
function groupIntoPairs(blocks: { json: string; isResponse: boolean }[]): RequestResponsePair[] {
  const pairs: RequestResponsePair[] = []
  let currentPair: Partial<RequestResponsePair> = {}

  for (const block of blocks) {
    const parsed = parseJsonBlock(block.json)
    if (!parsed) continue

    if (block.isResponse) {
      if (currentPair.request) {
        currentPair.response = parsed
        pairs.push(currentPair as RequestResponsePair)
        currentPair = {}
      }
    } else {
      // If we have an unpaired request, save it without response
      if (currentPair.request) {
        pairs.push(currentPair as RequestResponsePair)
      }
      currentPair = { request: parsed }
    }
  }

  // Handle trailing request without response
  if (currentPair.request) {
    pairs.push(currentPair as RequestResponsePair)
  }

  return pairs
}

/**
 * Split content by heading level
 */
function splitByHeading(content: string, level: number): { title: string; content: string; lineNumber: number }[] {
  const headingRegex = new RegExp(`^${'#'.repeat(level)}\\s+(.+)$`, 'gm')
  const sections: { title: string; content: string; lineNumber: number }[] = []

  let lastIndex = 0
  let lastTitle = ''
  let lastLineNumber = 1

  // Count line numbers up to a position
  const getLineNumber = (pos: number) => {
    return content.substring(0, pos).split('\n').length
  }

  let match
  while ((match = headingRegex.exec(content)) !== null) {
    if (lastIndex > 0) {
      sections.push({
        title: lastTitle,
        content: content.substring(lastIndex, match.index).trim(),
        lineNumber: lastLineNumber
      })
    }
    lastIndex = match.index + match[0].length
    lastTitle = match[1].trim()
    lastLineNumber = getLineNumber(match.index)
  }

  // Add the last section
  if (lastIndex > 0) {
    sections.push({
      title: lastTitle,
      content: content.substring(lastIndex).trim(),
      lineNumber: lastLineNumber
    })
  }

  return sections
}

/**
 * Extract description text (first paragraph after heading, before code blocks or sub-headings)
 */
function extractDescription(content: string): string {
  // Find first code block or heading
  const codeBlockStart = content.indexOf('```')
  const headingMatch = content.match(/^##/m)
  const headingStart = headingMatch ? content.indexOf(headingMatch[0]) : -1

  let endPos = content.length
  if (codeBlockStart !== -1 && codeBlockStart < endPos) {
    endPos = codeBlockStart
  }
  if (headingStart !== -1 && headingStart < endPos) {
    endPos = headingStart
  }

  return content.substring(0, endPos).trim()
}

/**
 * Parse a single test case section (H2 or H3)
 */
function parseTestCase(title: string, content: string, lineNumber: number): SpecTestCase {
  // Check for H3 sub-sections
  const h3Sections = splitByHeading(content, 3)

  // If there are H3 sections, process them as sub-cases
  if (h3Sections.length > 0) {
    // Get content before first H3 for this test case's own pairs
    const h3Start = content.indexOf('### ')
    const mainContent = h3Start !== -1 ? content.substring(0, h3Start) : content
    const blocks = extractJsonBlocks(mainContent)
    const pairs = groupIntoPairs(blocks)

    const subCases = h3Sections.map(section =>
      parseTestCase(section.title, section.content, section.lineNumber)
    )

    return {
      name: title,
      description: extractDescription(mainContent),
      pairs,
      subCases,
      lineNumber
    }
  }

  // No sub-sections, process normally
  const blocks = extractJsonBlocks(content)
  const pairs = groupIntoPairs(blocks)

  return {
    name: title,
    description: extractDescription(content),
    pairs,
    subCases: [],
    lineNumber
  }
}

/**
 * Parse a spec file and extract all test cases
 */
export function parseSpecFile(filePath: string): ParsedSpec | null {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Extract H1 heading (method name)
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (!h1Match) {
    return null
  }

  const method = h1Match[1].trim()

  // Get content after H1 heading
  const h1End = content.indexOf(h1Match[0]) + h1Match[0].length
  const contentAfterH1 = content.substring(h1End)

  // Extract description (first paragraph after H1)
  const firstH2 = contentAfterH1.indexOf('\n## ')
  const introContent = firstH2 !== -1
    ? contentAfterH1.substring(0, firstH2)
    : contentAfterH1

  const description = extractDescription(introContent)

  // Split by H2 headings
  const h2Sections = splitByHeading(contentAfterH1, 2)

  // Parse each H2 section as a test case
  const testCases = h2Sections.map(section =>
    parseTestCase(section.title, section.content, section.lineNumber)
  )

  return {
    method,
    filePath,
    description,
    testCases
  }
}

/**
 * Find all spec files in a directory
 */
export function findSpecFiles(specDir: string): string[] {
  const files: string[] = []

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  walk(specDir)
  return files.sort()
}

/**
 * Parse all spec files in a directory
 */
export function parseAllSpecs(specDir: string): ParsedSpec[] {
  const files = findSpecFiles(specDir)
  const specs: ParsedSpec[] = []

  for (const file of files) {
    const parsed = parseSpecFile(file)
    if (parsed) {
      specs.push(parsed)
    }
  }

  return specs
}

/**
 * Get the JMAP method from a parsed spec, if it's a known method
 */
export function getMethodFromSpec(spec: ParsedSpec): JMAPMethod | null {
  // The method name from the spec might not exactly match our capability keys
  // e.g., spec might have "Mailbox/get" which matches
  const method = spec.method as JMAPMethod

  // Import capabilities to check
  // We can't import at top level due to circular dependency risk
  // so we'll do a simple check here
  const knownMethods = [
    'Mailbox/get', 'Mailbox/set', 'Mailbox/query', 'Mailbox/queryChanges', 'Mailbox/changes',
    'Thread/get', 'Thread/changes',
    'Email/get', 'Email/set', 'Email/query', 'Email/queryChanges', 'Email/changes',
    'Email/copy', 'Email/import', 'Email/parse',
    'SearchSnippet/get',
    'Identity/get', 'Identity/set', 'Identity/changes',
    'EmailSubmission/get', 'EmailSubmission/set', 'EmailSubmission/query',
    'EmailSubmission/queryChanges', 'EmailSubmission/changes',
    'VacationResponse/get', 'VacationResponse/set',
    'Core/echo', 'Blob/copy', 'Blob/get', 'Blob/lookup', 'Blob/upload'
  ]

  return knownMethods.includes(method) ? method : null
}

/**
 * Group specs by object type (Mailbox, Email, etc.)
 */
export function groupSpecsByType(specs: ParsedSpec[]): Record<string, ParsedSpec[]> {
  const grouped: Record<string, ParsedSpec[]> = {}

  for (const spec of specs) {
    const [type] = spec.method.split('/')
    if (!grouped[type]) {
      grouped[type] = []
    }
    grouped[type].push(spec)
  }

  return grouped
}
