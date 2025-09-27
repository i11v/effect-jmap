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
      inReplyTo: null,
      references: null,
      sender: [{ name: "John Doe", email: "john@example.com" }],
      from: [{ name: "John Doe", email: "john@example.com" }],
      to: [{ name: "Test User", email: "test@example.com" }],
      cc: null,
      bcc: null,
      replyTo: null,
      subject: "Test Email",
      sentAt: "2024-01-15T10:29:00Z",
      hasAttachment: false,
      preview: "This is a test email for our JMAP implementation...",
      bodyValues: {
        "part-1": {
          value: "This is a test email for our JMAP implementation.",
          isEncodingProblem: false,
          isTruncated: false
        }
      },
      textBody: [{ partId: "part-1", type: "text/plain" }],
      htmlBody: [],
      attachments: []
    }
  ]
}