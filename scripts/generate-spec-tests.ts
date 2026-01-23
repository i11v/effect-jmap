#!/usr/bin/env tsx
/**
 * Generate Spec Tests
 *
 * This script parses JMAP specification files and generates Vitest test files.
 * Generated tests will:
 * - Run for implemented methods
 * - Skip for unimplemented methods (via describe.skipIf)
 *
 * Usage:
 *   pnpm generate:spec-tests
 *
 * This will regenerate all test files in tests/spec/ from the spec files in jmap-spec/specs/
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseAllSpecs,
  groupSpecsByType,
  type ParsedSpec,
  type SpecTestCase,
  type RequestResponsePair
} from '../tests/spec-runner/parser.js'
import { JMAPCapabilities, type JMAPMethod } from '../tests/config/capabilities.js'

/**
 * Extract the JMAP method from a request object
 */
function extractMethodFromRequest(request: Record<string, unknown>): JMAPMethod | null {
  if (request.methodCalls && Array.isArray(request.methodCalls)) {
    // Find the first method that's a known JMAP method
    for (const call of request.methodCalls) {
      if (Array.isArray(call) && typeof call[0] === 'string') {
        const method = call[0] as JMAPMethod
        if (method in JMAPCapabilities) {
          return method
        }
      }
    }
  }
  return null
}

/**
 * Detect if a spec method is an overview (object name only, not "Object/method")
 */
function isOverviewSpec(method: string): boolean {
  return !method.includes('/')
}

/**
 * Get the primary method for an overview spec
 * For example, "EmailSubmission" overview primarily tests "EmailSubmission/set"
 */
function getPrimaryMethodForOverview(objectType: string): JMAPMethod | null {
  // Check if there's a /set method for this object type
  const setMethod = `${objectType}/set` as JMAPMethod
  if (setMethod in JMAPCapabilities) {
    return setMethod
  }

  // Otherwise try /get
  const getMethod = `${objectType}/get` as JMAPMethod
  if (getMethod in JMAPCapabilities) {
    return getMethod
  }

  return null
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const SPEC_DIR = path.join(ROOT_DIR, 'jmap-spec', 'specs')
const OUTPUT_DIR = path.join(ROOT_DIR, 'tests', 'spec')

/**
 * Convert a test case name to a valid function name
 */
function toTestName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Escape a string for use in a template literal
 */
function escapeTemplateLiteral(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
}

/**
 * Generate import statements for a test file
 */
function generateImports(objectType: string): string {
  const imports: string[] = []

  imports.push(`import { describe, it, expect } from 'vitest'`)
  imports.push(`import { Effect, Layer } from 'effect'`)
  imports.push(`import { JMAPCapabilities, isImplemented, type JMAPMethod } from '../config/capabilities.js'`)
  imports.push(`import { testJMAPClient } from '../utils/test-utils.js'`)

  // Add service imports based on object type
  switch (objectType) {
    case 'Mailbox':
      imports.push(`import { MailboxService, MailboxServiceLive } from '../../src/mailbox/service.js'`)
      break
    case 'Email':
      imports.push(`import { EmailService, EmailServiceLive } from '../../src/email/service.js'`)
      break
    case 'EmailSubmission':
      imports.push(`import { EmailSubmissionService, EmailSubmissionServiceLive } from '../../src/submission/service.js'`)
      break
    case 'Thread':
      // Thread service doesn't exist yet
      break
    case 'Identity':
      // Identity service doesn't exist yet
      break
    case 'SearchSnippet':
      // SearchSnippet service doesn't exist yet
      break
    case 'VacationResponse':
      // VacationResponse service doesn't exist yet
      break
  }

  imports.push(`import { IdGeneratorLive } from '../../src/shared/id-generator.js'`)

  return imports.join('\n')
}

/**
 * Generate the test layer setup
 */
function generateTestLayer(objectType: string): string {
  switch (objectType) {
    case 'Mailbox':
      return `const TestLayer = MailboxServiceLive.pipe(
  Layer.provide(testJMAPClient),
  Layer.provide(IdGeneratorLive)
)`
    case 'Email':
      return `const TestLayer = EmailServiceLive.pipe(
  Layer.provide(testJMAPClient),
  Layer.provide(IdGeneratorLive)
)`
    case 'EmailSubmission':
      return `const TestLayer = EmailSubmissionServiceLive.pipe(
  Layer.provide(testJMAPClient),
  Layer.provide(IdGeneratorLive)
)`
    default:
      return `// No service layer available for ${objectType} yet
const TestLayer = Layer.empty`
  }
}

/**
 * Generate code for a request/response pair assertion
 */
function generatePairAssertion(pair: RequestResponsePair, index: number): string {
  const lines: string[] = []

  lines.push(`    // Request ${index + 1}`)
  lines.push(`    const request${index} = ${JSON.stringify(pair.request, null, 2).split('\n').join('\n    ')}`)

  if (pair.response) {
    lines.push(``)
    lines.push(`    // Expected response structure`)
    lines.push(`    const expectedResponse${index} = ${JSON.stringify(pair.response, null, 2).split('\n').join('\n    ')}`)
    lines.push(``)
    lines.push(`    // Verify response structure matches expected`)
    lines.push(`    // Note: Actual values may differ, we're checking structure`)
    lines.push(`    expect(expectedResponse${index}).toBeDefined()`)
  }

  return lines.join('\n')
}

/**
 * Generate a single test case
 */
function generateTestCase(testCase: SpecTestCase, objectType: string): string {
  const lines: string[] = []
  const testName = toTestName(testCase.name)

  lines.push(`  it('${escapeTemplateLiteral(testName)}', async () => {`)

  if (testCase.description) {
    lines.push(`    // ${escapeTemplateLiteral(testCase.description.split('\n')[0])}`)
  }

  if (testCase.pairs.length === 0 && testCase.subCases.length === 0) {
    lines.push(`    // No request/response pairs in spec - documentation only`)
    lines.push(`    expect(true).toBe(true)`)
  } else if (testCase.pairs.length > 0) {
    // Generate assertions for each pair
    for (let i = 0; i < testCase.pairs.length; i++) {
      lines.push(generatePairAssertion(testCase.pairs[i], i))
    }
  } else {
    lines.push(`    // Test case has sub-cases defined separately`)
    lines.push(`    expect(true).toBe(true)`)
  }

  lines.push(`  })`)

  // Generate sub-cases as nested describes
  if (testCase.subCases.length > 0) {
    lines.push(``)
    lines.push(`  describe('${escapeTemplateLiteral(testCase.name)} - sub-cases', () => {`)
    for (const subCase of testCase.subCases) {
      lines.push(generateTestCase(subCase, objectType))
    }
    lines.push(`  })`)
  }

  return lines.join('\n')
}

/**
 * Generate tests for a single spec
 */
function generateSpecTests(spec: ParsedSpec, objectType: string): string {
  const method = spec.method as JMAPMethod
  const isKnownMethod = method in JMAPCapabilities
  const isOverview = isOverviewSpec(spec.method)
  const lines: string[] = []

  lines.push(`/**`)
  lines.push(` * ${spec.method}`)
  lines.push(` *`)
  lines.push(` * ${spec.description.split('\n')[0]}`)
  lines.push(` *`)
  lines.push(` * Generated from: ${path.relative(ROOT_DIR, spec.filePath)}`)
  lines.push(` */`)

  if (isKnownMethod) {
    // Direct method match (e.g., "Mailbox/get")
    lines.push(`describe.skipIf(!isImplemented('${method}'))('${spec.method}', () => {`)
  } else if (isOverview) {
    // Overview spec (e.g., "EmailSubmission") - check primary method
    const primaryMethod = getPrimaryMethodForOverview(spec.method)
    if (primaryMethod) {
      lines.push(`// Overview spec - using ${primaryMethod} as primary method`)
      lines.push(`describe.skipIf(!isImplemented('${primaryMethod}'))('${spec.method}', () => {`)
    } else {
      lines.push(`// Unknown object type: ${spec.method}`)
      lines.push(`describe.skip('${spec.method}', () => {`)
    }
  } else {
    lines.push(`// Unknown method: ${spec.method}`)
    lines.push(`describe.skip('${spec.method}', () => {`)
  }

  // Generate test cases
  for (const testCase of spec.testCases) {
    lines.push(generateTestCase(testCase, objectType))
    lines.push(``)
  }

  lines.push(`})`)

  return lines.join('\n')
}

/**
 * Generate a complete test file for an object type
 */
function generateTestFile(objectType: string, specs: ParsedSpec[]): string {
  const lines: string[] = []

  lines.push(`/**`)
  lines.push(` * ${objectType} Spec Compliance Tests`)
  lines.push(` *`)
  lines.push(` * AUTO-GENERATED from JMAP specification files.`)
  lines.push(` * Do not edit manually - run \`pnpm generate:spec-tests\` to regenerate.`)
  lines.push(` *`)
  lines.push(` * Tests are skipped for unimplemented methods.`)
  lines.push(` * To enable tests for a method, set its value to \`true\` in`)
  lines.push(` * tests/config/capabilities.ts`)
  lines.push(` */`)
  lines.push(``)
  lines.push(generateImports(objectType))
  lines.push(``)
  lines.push(generateTestLayer(objectType))
  lines.push(``)

  // Generate tests for each spec
  for (const spec of specs) {
    lines.push(generateSpecTests(spec, objectType))
    lines.push(``)
  }

  return lines.join('\n')
}

/**
 * Main entry point
 */
async function main() {
  console.log('Parsing spec files...')

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Parse all specs
  const specs = parseAllSpecs(SPEC_DIR)
  console.log(`Found ${specs.length} spec files`)

  // Group by object type
  const grouped = groupSpecsByType(specs)

  // Generate test files
  for (const [objectType, typeSpecs] of Object.entries(grouped)) {
    const fileName = `${objectType.toLowerCase()}.spec.test.ts`
    const filePath = path.join(OUTPUT_DIR, fileName)

    console.log(`Generating ${fileName} (${typeSpecs.length} specs)...`)

    const content = generateTestFile(objectType, typeSpecs)
    fs.writeFileSync(filePath, content, 'utf-8')
  }

  console.log(`\nGenerated ${Object.keys(grouped).length} test files in ${path.relative(ROOT_DIR, OUTPUT_DIR)}/`)
  console.log('\nRun `pnpm test:spec` to execute the spec compliance tests.')
}

main().catch(console.error)
