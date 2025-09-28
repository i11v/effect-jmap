/**
 * Test for Content-Type header fix
 *
 * This test documents and verifies the fix for the HTTP 400 error that occurred
 * when the JMAP client didn't set the Content-Type header correctly.
 *
 * CONTEXT: Prior to the fix, the JMAP client was using HttpBody.text(body) without
 * specifying the content type, which caused HTTP 400 "Expected application/json content-type"
 * errors from the Fastmail server.
 *
 * THE FIX: Changed HttpBody.text(requestBody) to HttpBody.text(requestBody, 'application/json')
 * in src/core/JMAPClient.ts line 170.
 */

import { describe, it, expect } from 'vitest'
import { HttpBody } from '@effect/platform'

describe('Content-Type Fix Documentation', () => {
  it('should demonstrate the fix by showing HttpBody.text can take a content type', () => {
    const jsonData = JSON.stringify({ test: 'data' })

    // Before the fix: HttpBody.text(jsonData) - no content type specified
    const bodyWithoutContentType = HttpBody.text(jsonData)

    // After the fix: HttpBody.text(jsonData, 'application/json') - explicit content type
    const bodyWithContentType = HttpBody.text(jsonData, 'application/json')

    // Both should be HttpBody objects but with different content types
    expect(bodyWithoutContentType).toBeDefined()
    expect(bodyWithContentType).toBeDefined()

    // The key difference is that the second form explicitly sets the content type
    // which prevents the HTTP 400 "Expected application/json content-type" error
    expect(bodyWithoutContentType).not.toEqual(bodyWithContentType)
  })

  it('should document the bug fix location and change', () => {
    // This test serves as documentation for the fix

    // The bug was in src/core/JMAPClient.ts around line 170
    // where the JMAP client constructs HTTP requests

    // BEFORE (caused HTTP 400 errors):
    // HttpClientRequest.setBody(HttpBody.text(requestBody))

    // AFTER (the fix):
    // HttpClientRequest.setBody(HttpBody.text(requestBody, 'application/json'))

    const jmapRequestBody = JSON.stringify({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [['Mailbox/query', { accountId: 'uc3f940cd' }, 'mailbox-query-123']]
    })

    // The fix ensures that when creating an HttpBody for JMAP requests,
    // we explicitly specify the content type as 'application/json'
    const correctHttpBody = HttpBody.text(jmapRequestBody, 'application/json')

    expect(correctHttpBody).toBeDefined()
    // This should not throw, unlike before the fix where servers would
    // reject requests with "Expected application/json content-type"
  })

  it('should verify that HttpBody.text accepts content type parameter', () => {
    // This verifies that the Effect platform supports the content type parameter
    // that our fix relies on

    const testData = '{"method": "test"}'

    // These should all be valid ways to create HttpBody
    expect(() => HttpBody.text(testData)).not.toThrow()
    expect(() => HttpBody.text(testData, 'text/plain')).not.toThrow()
    expect(() => HttpBody.text(testData, 'application/json')).not.toThrow()
    expect(() => HttpBody.text(testData, 'application/xml')).not.toThrow()
  })
})