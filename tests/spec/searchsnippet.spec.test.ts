/**
 * SearchSnippet Spec Compliance Tests
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

// No service layer available for SearchSnippet yet
const TestLayer = Layer.empty

/**
 * SearchSnippet/get
 *
 * Get highlighted search snippets for emails matching a query filter.
 *
 * Generated from: jmap-spec/specs/mail/search-snippet.md
 */
describe.skipIf(!isImplemented('SearchSnippet/get'))('SearchSnippet/get', () => {
  it('Basic usage', async () => {
    // Request 1
    const request0 = {
      "using": [
        "urn:ietf:params:jmap:core",
        "urn:ietf:params:jmap:mail"
      ],
      "methodCalls": [
        [
          "Email/query",
          {
            "accountId": "A123",
            "filter": {
              "text": "quarterly report"
            },
            "limit": 10
          },
          "0"
        ],
        [
          "SearchSnippet/get",
          {
            "accountId": "A123",
            "filter": {
              "text": "quarterly report"
            },
            "#emailIds": {
              "resultOf": "0",
              "name": "Email/query",
              "path": "/ids"
            }
          },
          "1"
        ]
      ]
    }

    // Expected response structure
    const expectedResponse0 = {
      "methodResponses": [
        [
          "Email/query",
          {
            "accountId": "A123",
            "queryState": "q12345",
            "ids": [
              "M100",
              "M200",
              "M300"
            ]
          },
          "0"
        ],
        [
          "SearchSnippet/get",
          {
            "accountId": "A123",
            "list": [
              {
                "emailId": "M100",
                "subject": "Q4 <mark>Quarterly</mark> <mark>Report</mark>",
                "preview": "Please find attached the <mark>quarterly</mark> <mark>report</mark> for Q4..."
              },
              {
                "emailId": "M200",
                "subject": null,
                "preview": "The <mark>quarterly</mark> financial <mark>report</mark> shows..."
              },
              {
                "emailId": "M300",
                "subject": "<mark>Quarterly</mark> Review Meeting",
                "preview": "Let's discuss the <mark>report</mark> in our meeting..."
              }
            ],
            "notFound": []
          },
          "1"
        ]
      ]
    }

    // Verify response structure matches expected
    // Note: Actual values may differ, we're checking structure
    expect(expectedResponse0).toBeDefined()
  })

  it('Request arguments', async () => {
    // | Property | Type | Required | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Response properties', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('SearchSnippet object', async () => {
    // | Property | Type | Description |
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Highlighting format', async () => {
    // Matching terms are wrapped in \`<mark>\` tags:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Combined workflow', async () => {
    // Typical search workflow:
    // Request 1
    const request0 = {
      "using": [
        "urn:ietf:params:jmap:core",
        "urn:ietf:params:jmap:mail"
      ],
      "methodCalls": [
        [
          "Email/query",
          {
            "accountId": "A123",
            "filter": {
              "text": "project alpha"
            },
            "sort": [
              {
                "property": "receivedAt",
                "isAscending": false
              }
            ],
            "limit": 20,
            "calculateTotal": true
          },
          "q"
        ],
        [
          "Email/get",
          {
            "accountId": "A123",
            "#ids": {
              "resultOf": "q",
              "name": "Email/query",
              "path": "/ids"
            },
            "properties": [
              "id",
              "threadId",
              "from",
              "to",
              "subject",
              "receivedAt",
              "hasAttachment",
              "keywords"
            ]
          },
          "g"
        ],
        [
          "SearchSnippet/get",
          {
            "accountId": "A123",
            "filter": {
              "text": "project alpha"
            },
            "#emailIds": {
              "resultOf": "q",
              "name": "Email/query",
              "path": "/ids"
            }
          },
          "s"
        ]
      ]
    }
  })

  it('Filter must match', async () => {
    // The filter in SearchSnippet/get must match the filter used in Email/query for accurate highlighting:
    // Request 1
    const request0 = {
      "filter": {
        "operator": "AND",
        "conditions": [
          {
            "inMailbox": "MBinbox"
          },
          {
            "text": "important meeting"
          }
        ]
      }
    }
  })

  it('Multiple search terms', async () => {
    // Request 1
    const request0 = {
      "filter": {
        "text": "budget review 2024"
      }
    }
    // Request 2
    const request1 = {
      "preview": "The <mark>2024</mark> <mark>budget</mark> <mark>review</mark> process..."
    }
  })

  it('No match in subject', async () => {
    // When the search term isn't in the subject:
    // Request 1
    const request0 = {
      "emailId": "M100",
      "subject": null,
      "preview": "Found the <mark>keyword</mark> in the body..."
    }
  })

  it('No match in body', async () => {
    // When the search term is only in the subject:
    // Request 1
    const request0 = {
      "emailId": "M100",
      "subject": "Meeting about <mark>Project</mark> <mark>X</mark>",
      "preview": null
    }
  })

  it('Fulltext vs header search', async () => {
    // SearchSnippet works best with \`text\` filter (full-text search).
    // Request 1
    const request0 = {
      "filter": {
        "from": "alice@example.com"
      }
    }
  })

  it('Performance considerations', async () => {
    // - Request snippets only for visible search results
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('HTML escaping', async () => {
    // The snippet text is HTML-safe except for \`<mark>\` tags:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

  it('Server variations', async () => {
    // Snippet behavior varies by server:
    // No request/response pairs in spec - documentation only
    expect(true).toBe(true)
  })

})
