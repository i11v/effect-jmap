/**
 * Session Spec Compliance Tests
 *
 * AUTO-GENERATED from JMAP specification files.
 * Do not edit manually - run `pnpm generate:spec-tests` to regenerate.
 *
 * Tests are skipped for unimplemented methods.
 * To enable tests for a method, set its value to `true` in
 * tests/config/capabilities.ts
 */

import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { JMAPCapabilities, isImplemented, type JMAPMethod } from '../config/capabilities.js'
import { testJMAPClient } from '../utils/test-utils.js'
import { IdGeneratorLive } from '../../src/shared/id-generator.js'

// No service layer available for Session yet
const TestLayer = Layer.empty

/**
 * Session
 *
 * The JMAP Session resource provides information about the server's capabilities and the accounts available to the authenticated user. A client must first fetch the Session to discover API endpoints and account information.
 *
 * Generated from: jmap-spec/specs/core/session.md
 */
// Unknown object type: Session
describe.skip('Session', () => {
  it('Fetching the session', async () => {
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Session properties', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Core capability urnietfparamsjmapcore', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Account object', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Mail capability urnietfparamsjmapmail', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Submission capability urnietfparamsjmapsubmission', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Service autodiscovery', async () => {
    // Clients can discover the JMAP Session URL from a domain using:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Session state changes', async () => {
    // The \`state\` property changes when:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Example with multiple capabilities', async () => {
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

})
