import { Context, Effect, Layer } from "effect";
import { HttpClient } from "@effect/platform";

import { JMAPClientService } from "../core/JMAPClient.ts";
import type { JMAPClientInterface } from "../core/JMAPClient.ts";
import { Invocation } from "../core/Types.ts";
import {
  JMAPMethodError,
  NetworkError,
  AuthenticationError,
  SessionError,
} from "../core/Errors.ts";
import { extractMethodResponse } from "../core/ResponseUtils.ts";
import { BodyUtils } from "../core/EmailUtils.ts";
import { updateFilter } from "../core/TypeUtils.ts";
import {
  Email as EmailType,
  EmailGetArguments,
  EmailGetResponse,
  EmailSetArguments,
  EmailSetResponse,
  EmailQueryArguments,
  EmailQueryResponse,
  EmailQueryChangesArguments,
  EmailQueryChangesResponse,
  EmailCopyArguments,
  EmailCopyResponse,
  EmailImportArguments,
  EmailImportResponse,
  EmailMutable,
  EmailFilterCondition,
  EmailHelpers,
  StandardProperties,
} from "../schemas/Email.ts";
import { Id, Common, Keywords, StandardKeywords } from "../schemas/Common.ts";
import * as Schema from "effect/Schema";

/**
 * Email Service Interface
 */
export interface EmailService {
  /**
   * Get emails by ID with optional body content
   */
  readonly get: (
    args: EmailGetArguments,
  ) => Effect.Effect<
    Schema.Schema.Type<typeof EmailGetResponse>,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Create, update, or destroy emails
   */
  readonly set: (
    args: EmailSetArguments,
  ) => Effect.Effect<
    Schema.Schema.Type<typeof EmailSetResponse>,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Query emails with filters and sorting
   */
  readonly query: (
    args: EmailQueryArguments,
  ) => Effect.Effect<
    Schema.Schema.Type<typeof EmailQueryResponse>,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Get changes to an email query
   */
  readonly queryChanges: (
    args: EmailQueryChangesArguments,
  ) => Effect.Effect<
    Schema.Schema.Type<typeof EmailQueryChangesResponse>,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Copy emails between accounts
   */
  readonly copy: (
    args: EmailCopyArguments,
  ) => Effect.Effect<
    EmailCopyResponse,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Import emails from blobs
   */
  readonly import: (
    args: EmailImportArguments,
  ) => Effect.Effect<
    EmailImportResponse,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Get emails in a mailbox
   */
  readonly getByMailbox: (
    accountId: string,
    mailboxId: Id,
    options?: {
      limit?: number;
      properties?: string[];
      sort?: Array<{ property: string; isAscending?: boolean }>;
    },
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Search emails by text
   */
  readonly search: (
    accountId: string,
    searchQuery: string,
    options?: {
      limit?: number;
      mailboxId?: Id;
      properties?: string[];
    },
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Get unread emails
   */
  readonly getUnread: (
    accountId: string,
    mailboxId?: Id,
    limit?: number,
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Mark emails as read/unread
   */
  readonly markRead: (
    accountId: string,
    emailIds: Id[],
    read: boolean,
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Flag/unflag emails
   */
  readonly flag: (
    accountId: string,
    emailIds: Id[],
    flagged: boolean,
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Move emails to different mailbox
   */
  readonly move: (
    accountId: string,
    emailIds: Id[],
    fromMailboxId: Id,
    toMailboxId: Id,
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Add or remove keywords from emails
   */
  readonly updateKeywords: (
    accountId: string,
    emailIds: Id[],
    keywordsToAdd: string[],
    keywordsToRemove: string[],
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Get emails with full content (text and HTML bodies)
   */
  readonly getWithContent: (
    accountId: string,
    emailIds: Id[],
    maxBodyValueBytes?: number,
  ) => Effect.Effect<
    readonly EmailType[],
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;

  /**
   * Get a single email with full content by ID
   */
  readonly getEmailContent: (
    accountId: string,
    emailId: Id,
    maxBodyValueBytes?: number,
  ) => Effect.Effect<
    EmailType | null,
    JMAPMethodError | NetworkError | AuthenticationError | SessionError,
    JMAPClientInterface | HttpClient.HttpClient
  >;
}

/**
 * Email Service Tag
 */
export const EmailService = Context.GenericTag<EmailService>("EmailService");

/**
 * Live implementation of Email Service
 */
const makeEmailServiceLive = (): EmailService => {
  const get: EmailService["get"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const callId = `email-get-${Date.now()}`;

      const methodCall: Invocation = ["Email/get", args, callId];

      const response = yield* client.batch([methodCall]);
      return yield* extractMethodResponse(
        response,
        "Email/get",
        callId,
        EmailGetResponse,
      );
    });

  const set: EmailService["set"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const callId = `email-set-${Date.now()}`;

      const methodCall: Invocation = ["Email/set", args, callId];

      const response = yield* client.batch([methodCall]);
      return yield* extractMethodResponse(
        response,
        "Email/set",
        callId,
        EmailSetResponse,
      );
    });

  const query: EmailService["query"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const callId = `email-query-${Date.now()}`;

      const methodCall: Invocation = ["Email/query", args, callId];

      const response = yield* client.batch([methodCall]);
      return yield* extractMethodResponse(
        response,
        "Email/query",
        callId,
        EmailQueryResponse,
      );
    });

  const queryChanges: EmailService["queryChanges"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const callId = `email-queryChanges-${Date.now()}`;

      const methodCall: Invocation = ["Email/queryChanges", args, callId];

      const response = yield* client.batch([methodCall]);
      return yield* extractMethodResponse(
        response,
        "Email/queryChanges",
        callId,
        EmailQueryChangesResponse,
      );
    });

  const copy: EmailService["copy"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const callId = `email-copy-${Date.now()}`;

      const methodCall: Invocation = ["Email/copy", args, callId];

      const response = yield* client.batch([methodCall]);
      return yield* extractMethodResponse(
        response,
        "Email/copy",
        callId,
        EmailCopyResponse,
      );
    });

  const emailImport: EmailService["import"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const callId = `email-import-${Date.now()}`;

      const methodCall: Invocation = ["Email/import", args, callId];

      const response = yield* client.batch([methodCall]);
      return yield* extractMethodResponse(
        response,
        "Email/import",
        callId,
        EmailImportResponse,
      );
    });

  const getByMailbox: EmailService["getByMailbox"] = (
    accountId,
    mailboxId,
    options = {},
  ) =>
    Effect.gen(function* () {
      const queryResult = yield* query({
        accountId,
        filter: {
          inMailbox: mailboxId,
        },
        sort: options.sort,
        limit: options.limit
          ? Common.createUnsignedInt(options.limit)
          : undefined,
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      const getResult = yield* get({
        accountId,
        ids: queryResult.ids,
        properties: options.properties,
      });

      return getResult.list.filter((email): email is EmailType => email.blobId != null);
    });

  const search: EmailService["search"] = (
    accountId,
    searchQuery,
    options = {},
  ) =>
    Effect.gen(function* () {
      let filter: EmailFilterCondition = {
        text: searchQuery,
      };

      if (options.mailboxId) {
        filter = updateFilter(filter, { inMailbox: options.mailboxId });
      }

      const queryResult = yield* query({
        accountId,
        filter,
        limit: options.limit
          ? Common.createUnsignedInt(options.limit)
          : undefined,
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      const getResult = yield* get({
        accountId,
        ids: queryResult.ids,
        properties: options.properties,
      });

      return getResult.list.filter((email): email is EmailType => email.blobId != null);
    });

  const getUnread: EmailService["getUnread"] = (accountId, mailboxId, limit) =>
    Effect.gen(function* () {
      let filter: EmailFilterCondition = {
        notKeyword: StandardKeywords.SEEN,
      };

      if (mailboxId) {
        filter = updateFilter(filter, { inMailbox: mailboxId });
      }

      const queryResult = yield* query({
        accountId,
        filter,
        sort: [{ property: "receivedAt", isAscending: false }],
        limit: limit ? Common.createUnsignedInt(limit) : undefined,
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      const getResult = yield* get({
        accountId,
        ids: queryResult.ids,
        properties: StandardProperties.METADATA,
      });

      return getResult.list.filter((email): email is EmailType => email.blobId != null);
    });

  const markRead: EmailService["markRead"] = (accountId, emailIds, read) =>
    Effect.gen(function* () {
      const updates: Record<Id, Partial<EmailMutable>> = {};

      for (const emailId of emailIds) {
        const keywords = read
          ? { [StandardKeywords.SEEN]: true }
          : { [StandardKeywords.SEEN]: false };

        updates[emailId] = { keywords };
      }

      const result = yield* set({
        accountId,
        update: updates,
      });

      // Collect successfully updated emails
      const updatedEmails: EmailType[] = [];
      if (result.updated) {
        for (const [_, email] of Object.entries(result.updated)) {
          if (email) {
            updatedEmails.push(email);
          }
        }
      }

      return updatedEmails;
    });

  const flag: EmailService["flag"] = (accountId, emailIds, flagged) =>
    Effect.gen(function* () {
      const updates: Record<Id, Partial<EmailMutable>> = {};

      for (const emailId of emailIds) {
        const keywords = flagged
          ? EmailHelpers.createKeywords([StandardKeywords.FLAGGED])
          : { [StandardKeywords.FLAGGED]: false };

        updates[emailId] = { keywords };
      }

      const result = yield* set({
        accountId,
        update: updates,
      });

      const updatedEmails: EmailType[] = [];
      if (result.updated) {
        for (const [_, email] of Object.entries(result.updated)) {
          if (email) {
            updatedEmails.push(email);
          }
        }
      }

      return updatedEmails;
    });

  const move: EmailService["move"] = (
    accountId,
    emailIds,
    fromMailboxId,
    toMailboxId,
  ) =>
    Effect.gen(function* () {
      const updates: Record<Id, Partial<EmailMutable>> = {};

      for (const emailId of emailIds) {
        updates[emailId] = {
          mailboxIds: {
            [fromMailboxId]: false,
            [toMailboxId]: true,
          },
        };
      }

      const result = yield* set({
        accountId,
        update: updates,
      });

      const updatedEmails: EmailType[] = [];
      if (result.updated) {
        for (const [_, email] of Object.entries(result.updated)) {
          if (email) {
            updatedEmails.push(email);
          }
        }
      }

      return updatedEmails;
    });

  const updateKeywords: EmailService["updateKeywords"] = (
    accountId,
    emailIds,
    keywordsToAdd,
    keywordsToRemove,
  ) =>
    Effect.gen(function* () {
      const updates: Record<Id, Partial<EmailMutable>> = {};

      for (const emailId of emailIds) {
        let keywords: Keywords = {};

        // Add keywords
        for (const keyword of keywordsToAdd) {
          keywords = BodyUtils.addKeyword(keywords, keyword);
        }

        // Remove keywords
        for (const keyword of keywordsToRemove) {
          keywords = BodyUtils.removeKeyword(keywords, keyword);
        }

        updates[emailId] = { keywords };
      }

      const result = yield* set({
        accountId,
        update: updates,
      });

      const updatedEmails: EmailType[] = [];
      if (result.updated) {
        for (const [_, email] of Object.entries(result.updated)) {
          if (email) {
            updatedEmails.push(email);
          }
        }
      }

      return updatedEmails;
    });

  const getWithContent: EmailService["getWithContent"] = (
    accountId,
    emailIds,
    maxBodyValueBytes,
  ) =>
    Effect.gen(function* () {
      const result = yield* get({
        accountId,
        ids: emailIds,
        properties: undefined, // Get all properties
        fetchTextBodyValues: true,
        fetchHTMLBodyValues: true,
        fetchAllBodyValues: true,
        maxBodyValueBytes: maxBodyValueBytes
          ? Common.createUnsignedInt(maxBodyValueBytes)
          : undefined,
      });

      return result.list.filter((email): email is EmailType => email.blobId != null);
    });

  /**
   * Get a single email with full content by ID
   */
  const getEmailContent = (
    accountId: string,
    emailId: Id,
    maxBodyValueBytes?: number,
  ) =>
    Effect.gen(function* () {
      const emails = yield* getWithContent(accountId, [emailId], maxBodyValueBytes);
      return emails[0] || null;
    });

  return {
    get,
    set,
    query,
    queryChanges,
    copy,
    import: emailImport,
    getByMailbox,
    search,
    getUnread,
    markRead,
    flag,
    move,
    updateKeywords,
    getWithContent,
    getEmailContent,
  };
};

/**
 * Live layer for Email Service
 */
export const EmailServiceLive = Layer.succeed(
  EmailService,
  makeEmailServiceLive(),
);

/**
 * Convenience functions for common email operations
 */
export const EmailOperations = {
  /**
   * Get recent emails from inbox
   */
  getRecentInboxEmails: (accountId: string, inboxId: Id, limit: number = 10) =>
    Effect.gen(function* () {
      const service = yield* EmailService;
      const emails = yield* service.query({
        accountId,
        filter: {
          inMailbox: inboxId,
        },
        sort: [{ property: "receivedAt", isAscending: false }],
        limit: Common.createUnsignedInt(limit),
      });

      if (emails.ids.length === 0) {
        return [];
      }

      const result = yield* service.get({
        accountId,
        ids: emails.ids,
        properties: StandardProperties.ENVELOPE,
      });

      return result.list;
    }),

  /**
   * Get recent emails from inbox with full content
   */
  getRecentInboxEmailsWithContent: (accountId: string, inboxId: Id, limit: number = 10) =>
    Effect.gen(function* () {
      const service = yield* EmailService;
      const emails = yield* service.query({
        accountId,
        filter: {
          inMailbox: inboxId,
        },
        sort: [{ property: "receivedAt", isAscending: false }],
        limit: Common.createUnsignedInt(limit),
      });

      if (emails.ids.length === 0) {
        return [];
      }

      return yield* service.getWithContent(accountId, Array.from(emails.ids));
    }),

  /**
   * Get email thread
   */
  getEmailThread: (accountId: string, threadId: Id) =>
    Effect.gen(function* () {
      const service = yield* EmailService;
      const queryResult = yield* service.query({
        accountId,
        filter: {
          // Note: JMAP doesn't have a direct threadId filter
          // This would typically be done through Thread/get method
          // For now, we'll use a text search as placeholder
        },
        sort: [{ property: "receivedAt", isAscending: true }],
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      const getResult = yield* service.get({
        accountId,
        ids: queryResult.ids,
      });

      // Filter by threadId (this should be done server-side in real implementation)
      return getResult.list.filter((email) => email.threadId === threadId);
    }),

  /**
   * Mark all emails in mailbox as read
   */
  markMailboxRead: (accountId: string, mailboxId: Id) =>
    Effect.gen(function* () {
      const service = yield* EmailService;
      const queryResult = yield* service.query({
        accountId,
        filter: {
          inMailbox: mailboxId,
          notKeyword: StandardKeywords.SEEN,
        },
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      return yield* service.markRead(accountId, Array.from(queryResult.ids), true);
    }),

  /**
   * Delete emails (move to trash)
   */
  deleteEmails: (accountId: string, emailIds: Id[], trashMailboxId: Id) =>
    Effect.gen(function* () {
      const service = yield* EmailService;

      // First get the current emails to know which mailboxes they're in
      const getResult = yield* service.get({
        accountId,
        ids: emailIds,
        properties: ["id", "mailboxIds"],
      });

      const updates: Record<Id, Partial<EmailMutable>> = {};

      for (const email of getResult.list) {
        // Remove from current mailboxes and add to trash
        const newMailboxIds: Record<Id, boolean> = {};

        // Remove from all current mailboxes
        if (email.mailboxIds) {
          for (const mailboxId of Object.keys(email.mailboxIds)) {
            if (email.mailboxIds[mailboxId as Id]) {
              newMailboxIds[mailboxId as Id] = false;
            }
          }
        }

        // Add to trash
        newMailboxIds[trashMailboxId] = true;

        updates[email.id] = { mailboxIds: newMailboxIds };
      }

      const result = yield* service.set({
        accountId,
        update: updates,
      });

      const updatedEmails: EmailType[] = [];
      if (result.updated) {
        for (const [_, email] of Object.entries(result.updated)) {
          if (email) {
            updatedEmails.push(email);
          }
        }
      }

      return updatedEmails;
    }),

  /**
   * Archive emails
   */
  archiveEmails: (accountId: string, emailIds: Id[], archiveMailboxId: Id) =>
    Effect.gen(function* () {
      const service = yield* EmailService;

      // Similar to delete, but move to archive
      const getResult = yield* service.get({
        accountId,
        ids: emailIds,
        properties: ["id", "mailboxIds"],
      });

      const updates: Record<Id, Partial<EmailMutable>> = {};

      for (const email of getResult.list) {
        const newMailboxIds: Record<Id, boolean> = {};

        // Remove from current mailboxes
        if (email.mailboxIds) {
          for (const mailboxId of Object.keys(email.mailboxIds)) {
            if (email.mailboxIds[mailboxId as Id]) {
              newMailboxIds[mailboxId as Id] = false;
            }
          }
        }

        // Add to archive
        newMailboxIds[archiveMailboxId] = true;

        updates[email.id] = { mailboxIds: newMailboxIds };
      }

      const result = yield* service.set({
        accountId,
        update: updates,
      });

      const updatedEmails: EmailType[] = [];
      if (result.updated) {
        for (const [_, email] of Object.entries(result.updated)) {
          if (email) {
            updatedEmails.push(email);
          }
        }
      }

      return updatedEmails;
    }),
};
