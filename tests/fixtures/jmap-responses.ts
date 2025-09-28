/**
 * Mock JMAP API responses for testing
 */
export const JMAPFixtures = {
  session: {
    capabilities: {
      "urn:ietf:params:jmap:core": {
        "maxSizeUpload": 50000000,
        "maxConcurrentUpload": 4,
        "maxSizeRequest": 10000000,
        "maxConcurrentRequests": 4,
        "maxCallsInRequest": 16,
        "maxObjectsInGet": 500,
        "maxObjectsInSet": 500,
        "collationAlgorithms": ["i;ascii-numeric", "i;ascii-casemap"]
      },
      "urn:ietf:params:jmap:mail": {
        "maxMailboxesPerEmail": 10,
        "maxMailboxDepth": 10,
        "maxSizeMailboxName": 490,
        "maxSizeAttachmentsPerEmail": 20000000,
        "emailQuerySortOptions": ["receivedAt", "sentAt", "size", "from", "to", "subject"],
        "mayCreateTopLevelMailbox": true
      }
    },
    accounts: {
      "account-1": {
        "name": "test@example.com",
        "isPersonal": true,
        "isReadOnly": false,
        "accountCapabilities": {
          "urn:ietf:params:jmap:core": {},
          "urn:ietf:params:jmap:mail": {}
        }
      }
    },
    primaryAccounts: {
      "urn:ietf:params:jmap:core": "account-1",
      "urn:ietf:params:jmap:mail": "account-1"
    },
    username: "test@example.com",
    apiUrl: "https://api.fastmail.com/jmap/api/",
    downloadUrl: "https://api.fastmail.com/jmap/download/{accountId}/{blobId}/{name}?accept={type}",
    uploadUrl: "https://api.fastmail.com/jmap/upload/{accountId}/",
    eventSourceUrl: "https://api.fastmail.com/jmap/eventsource/?types={types}&closeafter={closeafter}&ping={ping}",
    state: "cyrus-1"
  },

  mailboxes: [
    {
      id: "mailbox-1",
      name: "Inbox",
      parentId: null,
      role: "inbox",
      sortOrder: 0,
      totalEmails: 42,
      unreadEmails: 5,
      totalThreads: 35,
      unreadThreads: 3,
      myRights: {
        mayReadItems: true,
        mayAddItems: true,
        mayRemoveItems: true,
        maySetSeen: true,
        maySetKeywords: true,
        mayCreateChild: true,
        mayRename: false,
        mayDelete: false,
        maySubmit: true
      },
      isSubscribed: true
    }
  ],

  emails: [
    {
      id: "email-1",
      blobId: "blob-1",
      threadId: "thread-1",
      mailboxIds: { "mailbox-1": true },
      keywords: { "$seen": true },
      size: 2048,
      receivedAt: "2024-01-15T10:30:00Z",
      messageId: ["<message-1@example.com>"],
      sender: [{ name: "John Doe", email: "john@example.com" }],
      from: [{ name: "John Doe", email: "john@example.com" }],
      to: [{ name: "Test User", email: "test@example.com" }],
      subject: "Test Email 1",
      sentAt: "2024-01-15T10:29:00Z",
      hasAttachment: false,
      preview: "This is a test email for our JMAP implementation...",
      bodyValues: {
        "1": {
          value: "This is the email content for email 1.",
          isEncodingProblem: false,
          isTruncated: false
        }
      },
      textBody: [{ partId: "1", type: "text/plain", size: 256 }],
      htmlBody: [],
      attachments: []
    },
    {
      id: "email-2",
      blobId: "blob-2",
      threadId: "thread-2",
      mailboxIds: { "mailbox-1": true },
      keywords: { "$flagged": true },
      size: 4096,
      receivedAt: "2024-01-16T14:20:00Z",
      messageId: ["<message-2@example.com>"],
      sender: [{ name: "Jane Smith", email: "jane@example.com" }],
      from: [{ name: "Jane Smith", email: "jane@example.com" }],
      to: [{ name: "Test User", email: "test@example.com" }],
      subject: "Test Email 2",
      sentAt: "2024-01-16T14:19:00Z",
      hasAttachment: true,
      preview: "Second test email with attachment...",
      bodyValues: {
        "1": {
          value: "This is the second test email with an attachment.",
          isEncodingProblem: false,
          isTruncated: false
        },
        "2": {
          value: "<p>This is <strong>HTML</strong> content.</p>",
          isEncodingProblem: false,
          isTruncated: false
        }
      },
      textBody: [{ partId: "1", type: "text/plain", size: 512 }],
      htmlBody: [{ partId: "2", type: "text/html", size: 256 }],
      attachments: [
        {
          blobId: "attachment-1",
          type: "application/pdf",
          name: "document.pdf",
          size: 2048
        }
      ]
    }
  ]
}

// Email-specific mock responses
export const sampleEmails = JMAPFixtures.emails

export const mockEmailGetResponse = {
  accountId: "test-account",
  state: "state-123",
  list: sampleEmails,
  notFound: []
}

export const mockEmailSetResponse = {
  accountId: "test-account",
  oldState: "state-123",
  newState: "state-124",
  updated: {
    "email-1": sampleEmails[0]
  },
  destroyed: ["email-1", "email-2"]
}

export const mockEmailQueryResponse = {
  accountId: "test-account",
  queryState: "query-state-123",
  canCalculateChanges: true,
  position: 0,
  ids: ["email-1"],
  total: 1,
  limit: 10
}

export const mockEmailCopyResponse = {
  fromAccountId: "source-account",
  accountId: "target-account",
  newState: "state-125",
  created: {
    "temp1": sampleEmails[0]
  }
}

export const mockEmailImportResponse = {
  accountId: "test-account",
  oldState: "state-125",
  newState: "state-126",
  created: {
    "import1": sampleEmails[0]
  }
}