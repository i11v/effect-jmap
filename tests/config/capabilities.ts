/**
 * JMAP Capability Registry
 *
 * Single source of truth for implementation status of all JMAP methods.
 * This registry is used by spec tests to determine which tests should
 * run (implemented) vs skip (not implemented).
 *
 * When implementing a new feature:
 * 1. Change the method's value from `false` to `true`
 * 2. Run `pnpm test:spec` to see the tests start running
 * 3. Implement the feature until tests pass
 */

/**
 * All JMAP methods defined in RFC 8620 (Core) and RFC 8621 (Mail)
 * with their implementation status.
 *
 * `true` = implemented and should be tested
 * `false` = not implemented, tests will be skipped
 */
export const JMAPCapabilities = {
  // Mailbox methods (RFC 8621 Section 2)
  'Mailbox/get': true,
  'Mailbox/set': true,
  'Mailbox/query': true,
  'Mailbox/queryChanges': true,
  'Mailbox/changes': false,

  // Thread methods (RFC 8621 Section 3)
  'Thread/get': false,
  'Thread/changes': false,

  // Email methods (RFC 8621 Section 4)
  'Email/get': true,
  'Email/set': true,
  'Email/query': true,
  'Email/queryChanges': true,
  'Email/changes': true,
  'Email/copy': true,
  'Email/import': true,
  'Email/parse': true,

  // SearchSnippet methods (RFC 8621 Section 5)
  'SearchSnippet/get': false,

  // Identity methods (RFC 8621 Section 6)
  'Identity/get': false,
  'Identity/set': false,
  'Identity/changes': false,

  // EmailSubmission methods (RFC 8621 Section 7)
  'EmailSubmission/get': true,
  'EmailSubmission/set': true,
  'EmailSubmission/query': true,
  'EmailSubmission/queryChanges': true,
  'EmailSubmission/changes': true,

  // VacationResponse methods (RFC 8621 Section 8)
  'VacationResponse/get': false,
  'VacationResponse/set': false,

  // Core methods (RFC 8620)
  'Core/echo': false,
  'Blob/copy': false,
  'Blob/get': false,
  'Blob/lookup': false,
  'Blob/upload': false,
} as const

/**
 * Type representing all known JMAP method names
 */
export type JMAPMethod = keyof typeof JMAPCapabilities

/**
 * Check if a JMAP method is implemented
 */
export const isImplemented = (method: JMAPMethod): boolean => {
  return JMAPCapabilities[method]
}

/**
 * Get all implemented methods
 */
export const getImplementedMethods = (): JMAPMethod[] => {
  return Object.entries(JMAPCapabilities)
    .filter(([_, implemented]) => implemented)
    .map(([method]) => method as JMAPMethod)
}

/**
 * Get all unimplemented methods
 */
export const getUnimplementedMethods = (): JMAPMethod[] => {
  return Object.entries(JMAPCapabilities)
    .filter(([_, implemented]) => !implemented)
    .map(([method]) => method as JMAPMethod)
}

/**
 * Get implementation completeness as a percentage
 */
export const getCompleteness = (): {
  implemented: number
  total: number
  percentage: number
} => {
  const methods = Object.values(JMAPCapabilities)
  const implemented = methods.filter(Boolean).length
  const total = methods.length
  const percentage = Math.round((implemented / total) * 100 * 10) / 10

  return { implemented, total, percentage }
}

/**
 * Get completeness by object type (Mailbox, Email, etc.)
 */
export const getCompletenessByType = (): Record<string, {
  implemented: number
  total: number
  percentage: number
  methods: { name: string; implemented: boolean }[]
}> => {
  const byType: Record<string, { name: string; implemented: boolean }[]> = {}

  for (const [method, implemented] of Object.entries(JMAPCapabilities)) {
    const [type] = method.split('/')
    if (!byType[type]) {
      byType[type] = []
    }
    byType[type].push({ name: method, implemented })
  }

  const result: Record<string, {
    implemented: number
    total: number
    percentage: number
    methods: { name: string; implemented: boolean }[]
  }> = {}

  for (const [type, methods] of Object.entries(byType)) {
    const implemented = methods.filter(m => m.implemented).length
    const total = methods.length
    const percentage = Math.round((implemented / total) * 100 * 10) / 10
    result[type] = { implemented, total, percentage, methods }
  }

  return result
}

/**
 * Extract the object type from a method name (e.g., "Mailbox" from "Mailbox/get")
 */
export const getObjectType = (method: JMAPMethod): string => {
  return method.split('/')[0]
}

/**
 * Extract the operation from a method name (e.g., "get" from "Mailbox/get")
 */
export const getOperation = (method: JMAPMethod): string => {
  return method.split('/')[1]
}
