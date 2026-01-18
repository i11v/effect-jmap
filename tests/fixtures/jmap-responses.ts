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

  // Per RFC 8621: EmailBodyPart requires all fields with nullable values as null
  bodyPart: (overrides: Record<string, any> = {}) => ({
    partId: "1",
    blobId: "blob-part-1",
    size: 256,
    type: "text/plain",
    charset: "utf-8",
    name: null,
    disposition: null,
    cid: null,
    language: null,
    location: null,
    subParts: null,
    ...overrides
  }),

  emails: [
    {
      id: "email-1",
      blobId: "blob-1",
      threadId: "thread-1",
      mailboxIds: { "mailbox-1": true },
      keywords: { "$seen": true },
      size: 2048,
      receivedAt: "2024-01-15T10:30:00Z",
      // Per RFC 8621: nullable fields use null, not undefined
      sentAt: "2024-01-15T10:29:00Z",
      messageId: ["<message-1@example.com>"],
      inReplyTo: null,
      references: null,
      sender: [{ name: "John Doe", email: "john@example.com" }],
      from: [{ name: "John Doe", email: "john@example.com" }],
      to: [{ name: "Test User", email: "test@example.com" }],
      cc: null,
      bcc: null,
      replyTo: null,
      subject: "Test Email 1",
      hasAttachment: false,
      preview: "This is a test email for our JMAP implementation...",
      bodyValues: {
        "1": {
          value: "This is the email content for email 1.",
          isEncodingProblem: false,
          isTruncated: false
        }
      },
      textBody: [{
        partId: "1",
        blobId: "blob-part-1",
        size: 256,
        type: "text/plain",
        charset: "utf-8",
        name: null,
        disposition: null,
        cid: null,
        language: null,
        location: null,
        subParts: null
      }],
      htmlBody: [],
      attachments: [],
      headers: []
    },
    {
      id: "email-2",
      blobId: "blob-2",
      threadId: "thread-2",
      mailboxIds: { "mailbox-1": true },
      keywords: { "$flagged": true },
      size: 4096,
      receivedAt: "2024-01-16T14:20:00Z",
      sentAt: "2024-01-16T14:19:00Z",
      messageId: ["<message-2@example.com>"],
      inReplyTo: null,
      references: null,
      sender: [{ name: "Jane Smith", email: "jane@example.com" }],
      from: [{ name: "Jane Smith", email: "jane@example.com" }],
      to: [{ name: "Test User", email: "test@example.com" }],
      cc: null,
      bcc: null,
      replyTo: null,
      subject: "Test Email 2",
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
      textBody: [{
        partId: "1",
        blobId: "blob-part-2",
        size: 512,
        type: "text/plain",
        charset: "utf-8",
        name: null,
        disposition: null,
        cid: null,
        language: null,
        location: null,
        subParts: null
      }],
      htmlBody: [{
        partId: "2",
        blobId: "blob-part-3",
        size: 256,
        type: "text/html",
        charset: "utf-8",
        name: null,
        disposition: null,
        cid: null,
        language: null,
        location: null,
        subParts: null
      }],
      attachments: [
        {
          blobId: "attachment-1",
          type: "application/pdf",
          name: "document.pdf",
          size: 2048,
          cid: null,
          disposition: "attachment"
        }
      ],
      headers: []
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
    "import1": {
      id: "email-1",
      blobId: "blob-1",
      threadId: "thread-1",
      size: 2048
    }
  }
}

// Full email import response (some JMAP servers may return this)
export const mockEmailImportResponseFull = {
  accountId: "test-account",
  oldState: "state-125",
  newState: "state-126",
  created: {
    "import1": sampleEmails[0]
  }
}

// EmailSubmission-specific mock responses
// Per RFC 8621: parameters is Object|null, envelope is Envelope|null
export const sampleEmailSubmissions = [
  {
    id: "submission-1",
    identityId: "identity-1",
    emailId: "email-1",
    threadId: "thread-1",
    envelope: null,
    sendAt: "2024-01-15T10:30:00Z",
    undoStatus: "final",
    deliveryStatus: {
      "test@example.com": {
        smtpReply: "250 2.0.0 OK",
        delivered: "yes",
        displayed: "unknown"
      }
    },
    dsnBlobIds: [],
    mdnBlobIds: []
  },
  {
    id: "submission-2",
    identityId: "identity-1",
    emailId: "email-2",
    threadId: "thread-2",
    envelope: {
      mailFrom: { email: "sender@example.com", parameters: null },
      rcptTo: [
        { email: "recipient1@example.com", parameters: null },
        { email: "recipient2@example.com", parameters: null }
      ]
    },
    sendAt: "2024-01-16T14:20:00Z",
    undoStatus: "pending",
    deliveryStatus: null,
    dsnBlobIds: [],
    mdnBlobIds: []
  }
]

export const mockEmailSubmissionGetResponse = {
  accountId: "test-account",
  state: "submission-state-123",
  list: sampleEmailSubmissions,
  notFound: []
}

// Minimal EmailSubmission/set response (matches Fastmail behavior)
// Per RFC 8620: created, updated, destroyed etc. are nullable, not optional
export const mockEmailSubmissionSetResponse = {
  accountId: "test-account",
  oldState: "submission-state-123",
  newState: "submission-state-124",
  created: {
    "temp1": {
      id: "submission-1",
      sendAt: "2024-01-15T10:30:00Z",
      undoStatus: "final"
    }
  },
  updated: {
    "submission-1": {
      id: "submission-1",
      sendAt: "2024-01-15T10:30:00Z",
      undoStatus: "final"
    }
  },
  destroyed: [],
  notCreated: null,
  notUpdated: null,
  notDestroyed: null
}

// Full EmailSubmission/set response (some JMAP servers may return this)
export const mockEmailSubmissionSetResponseFull = {
  accountId: "test-account",
  oldState: "submission-state-123",
  newState: "submission-state-124",
  created: {
    "temp1": sampleEmailSubmissions[0]
  },
  updated: {
    "submission-1": sampleEmailSubmissions[0]
  },
  destroyed: [],
  notCreated: null,
  notUpdated: null,
  notDestroyed: null
}

export const mockEmailSubmissionQueryResponse = {
  accountId: "test-account",
  queryState: "submission-query-state-123",
  canCalculateChanges: true,
  position: 0,
  ids: ["submission-1", "submission-2"],
  total: 2,
  limit: 10
}

export const mockEmailSubmissionQueryChangesResponse = {
  accountId: "test-account",
  oldQueryState: "submission-query-state-123",
  newQueryState: "submission-query-state-124",
  removed: [],
  added: [{ id: "submission-3", index: 0 }]
}

export const mockEmailSubmissionChangesResponse = {
  accountId: "test-account",
  oldState: "submission-state-123",
  newState: "submission-state-124",
  hasMoreChanges: false,
  created: ["submission-3"],
  updated: ["submission-1"],
  destroyed: []
}