/**
 * JMAP Capability URNs and Sets
 *
 * This module defines constants for JMAP capability URNs as specified in:
 * - RFC 8620 (JMAP Core)
 * - RFC 8621 (JMAP Mail)
 * - RFC 8621 Section 7 (JMAP Email Submission)
 */

/**
 * Individual JMAP capability URNs
 */
export const JMAP_CAPABILITIES = {
  /**
   * Core JMAP capability - required for all JMAP operations
   */
  CORE: 'urn:ietf:params:jmap:core',

  /**
   * Mail capability - required for email, mailbox operations
   */
  MAIL: 'urn:ietf:params:jmap:mail',

  /**
   * Email Submission capability - required for sending emails
   */
  SUBMISSION: 'urn:ietf:params:jmap:submission'
} as const

/**
 * Type for capability URN strings
 */
export type JMAPCapability = typeof JMAP_CAPABILITIES[keyof typeof JMAP_CAPABILITIES]

/**
 * Predefined capability sets for common operation types
 */
export const CAPABILITY_SETS = {
  /**
   * Capabilities for basic mail operations (get, query, set for emails and mailboxes)
   */
  MAIL: [JMAP_CAPABILITIES.CORE, JMAP_CAPABILITIES.MAIL] as const,

  /**
   * Capabilities for email submission operations (sending emails)
   */
  SUBMISSION: [
    JMAP_CAPABILITIES.CORE,
    JMAP_CAPABILITIES.MAIL,
    JMAP_CAPABILITIES.SUBMISSION
  ] as const
} as const

/**
 * Type for capability sets
 */
export type CapabilitySet = typeof CAPABILITY_SETS[keyof typeof CAPABILITY_SETS]
