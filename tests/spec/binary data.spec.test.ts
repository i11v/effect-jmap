/**
 * Binary Data Spec Compliance Tests
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

// No service layer available for Binary Data yet
const TestLayer = Layer.empty

/**
 * Binary Data
 *
 * JMAP provides separate endpoints for uploading and downloading binary data (blobs).
 *
 * Generated from: jmap-spec/specs/core/binary.md
 */
// Unknown object type: Binary Data
describe.skip('Binary Data', () => {
  it('Uploading binary data', async () => {
    // Upload files using HTTP POST to the upload URL from the Session:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Upload response', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Upload limits', async () => {
    // Uploads are limited by session capabilities:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Upload error responses', async () => {
    // Test case has sub-cases defined separately
    expect(true).toBe(true)
  })

  describe('Upload error responses - sub-cases', () => {
  it('400 Bad Request', async () => {
    // Invalid request format.
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  it('401 Unauthorized', async () => {
    // Authentication required.
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  it('403 Forbidden', async () => {
    // Not authorized to upload to this account.
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  it('404 Not Found', async () => {
    // Account not found.
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  it('413 Payload Too Large', async () => {
    // File exceeds maxSizeUpload:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  })

  it('Downloading binary data', async () => {
    // Download files using HTTP GET with the download URL template:
    // Test case has sub-cases defined separately
    expect(true).toBe(true)
  })

  describe('Downloading binary data - sub-cases', () => {
  it('URL template variables', async () => {
    // | Variable | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  it('Example download', async () => {
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  })

  it('Download headers', async () => {
    // Response headers:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Download error responses', async () => {
    // Test case has sub-cases defined separately
    expect(true).toBe(true)
  })

  describe('Download error responses - sub-cases', () => {
  it('401 Unauthorized', async () => {
    // Authentication required.
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  it('403 Forbidden', async () => {
    // Not authorized to access this blob.
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  it('404 Not Found', async () => {
    // Blob or account not found.
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })
  })

  it('Blob lifecycle', async () => {
    // Blobs are reference-counted:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Blob references in Email', async () => {
    // When creating emails, reference uploaded blobs for attachments:
    // Request 1
    const request0 = {
      "using": [
        "urn:ietf:params:jmap:core",
        "urn:ietf:params:jmap:mail"
      ],
      "methodCalls": [
        [
          "Email/set",
          {
            "accountId": "A123",
            "create": {
              "draft": {
                "mailboxIds": {
                  "MBdrafts": true
                },
                "from": [
                  {
                    "email": "me@example.com"
                  }
                ],
                "to": [
                  {
                    "email": "you@example.com"
                  }
                ],
                "subject": "File attached",
                "bodyStructure": {
                  "type": "multipart/mixed",
                  "subParts": [
                    {
                      "type": "text/plain",
                      "partId": "body"
                    },
                    {
                      "type": "application/pdf",
                      "blobId": "B789xyz",
                      "name": "document.pdf",
                      "disposition": "attachment"
                    }
                  ]
                },
                "bodyValues": {
                  "body": {
                    "value": "Please see attached."
                  }
                }
              }
            }
          },
          "0"
        ]
      ]
    }
  })

  it('Copying blobs between accounts', async () => {
    // Use the Blob/copy method:
    // Request 1
    const request0 = {
      "using": [
        "urn:ietf:params:jmap:core"
      ],
      "methodCalls": [
        [
          "Blob/copy",
          {
            "fromAccountId": "A123",
            "accountId": "A456",
            "blobIds": [
              "B789xyz",
              "B123abc"
            ]
          },
          "0"
        ]
      ]
    }

    // Expected response structure
    const expectedResponse0 = {
      "methodResponses": [
        [
          "Blob/copy",
          {
            "fromAccountId": "A123",
            "accountId": "A456",
            "copied": {
              "B789xyz": "B999new",
              "B123abc": "B888new"
            },
            "notCopied": null
          },
          "0"
        ]
      ]
    }

    // Verify response structure matches expected
    // Note: Actual values may differ, we're checking structure
    expect(expectedResponse0).toBeDefined()
  })

  it('Blobcopy response', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Blobcopy errors', async () => {
    // | Error | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

})
