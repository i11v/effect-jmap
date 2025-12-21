import { Context, Effect, Layer } from "effect";
import { HttpClient } from "@effect/platform";

import { JMAPClientService } from "../client/client.ts";
import { Invocation } from "../client/types.ts";
import { IdGenerator } from "../shared/id-generator.ts";
import {
  JMAPMethodError,
  NetworkError,
  AuthenticationError,
  SessionError,
} from "../client/errors.ts";
import { CAPABILITY_SETS } from "../client/capabilities.ts";
import { extractMethodResponse } from "../client/response-utils.ts";
import {
  EmailSubmissionObject,
  EmailSubmissionSetResult,
  EmailSubmissionGetArguments,
  EmailSubmissionGetResponse,
  EmailSubmissionSetArguments,
  EmailSubmissionSetResponse,
  EmailSubmissionQueryArguments,
  EmailSubmissionQueryResponse,
  EmailSubmissionQueryChangesArguments,
  EmailSubmissionQueryChangesResponse,
  EmailSubmissionChangesArguments,
  EmailSubmissionChangesResponse,
  Envelope,
  EmailSubmissionHelpers,
} from "./schema.ts";
import { Id, Common, JMAPDate } from "../shared/common.ts";
import * as Schema from "effect/Schema";

/**
 * EmailSubmission Service Interface
 */
export interface EmailSubmissionServiceInterface {
    /**
     * Get email submissions by ID
     */
    readonly get: (
      args: EmailSubmissionGetArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof EmailSubmissionGetResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Create, update, or destroy email submissions
     */
    readonly set: (
      args: EmailSubmissionSetArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof EmailSubmissionSetResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Query email submissions with filters and sorting
     */
    readonly query: (
      args: EmailSubmissionQueryArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof EmailSubmissionQueryResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get changes to an email submission query
     */
    readonly queryChanges: (
      args: EmailSubmissionQueryChangesArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof EmailSubmissionQueryChangesResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get changes to email submissions since a state
     */
    readonly changes: (
      args: EmailSubmissionChangesArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof EmailSubmissionChangesResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Send an email by creating a submission
     */
    readonly send: (
      accountId: string,
      identityId: Id,
      emailId: Id,
      options?: {
        envelope?: Envelope | null;
        sendAt?: JMAPDate;
        onSuccessUpdateEmail?: Record<string, any> | null;
        onSuccessDestroyEmail?: Id[] | boolean | null;
      },
    ) => Effect.Effect<
      EmailSubmissionSetResult,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get delivery status for a submission
     */
    readonly getDeliveryStatus: (
      accountId: string,
      submissionId: Id,
    ) => Effect.Effect<
      EmailSubmissionObject | undefined,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Cancel a scheduled email submission
     */
    readonly cancelScheduled: (
      accountId: string,
      submissionId: Id,
    ) => Effect.Effect<
      EmailSubmissionSetResult | undefined,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get all submissions for a specific email
     */
    readonly getByEmailId: (
      accountId: string,
      emailId: Id,
    ) => Effect.Effect<
      readonly EmailSubmissionObject[],
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get recent submissions
     */
    readonly getRecent: (
      accountId: string,
      limit?: number,
    ) => Effect.Effect<
      readonly EmailSubmissionObject[],
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;
}

/**
 * EmailSubmission Service Tag
 */
export class EmailSubmissionService extends Context.Tag("EmailSubmissionService")<
  EmailSubmissionService,
  EmailSubmissionServiceInterface
>() {}

/**
 * Live implementation of EmailSubmission Service
 */
const makeEmailSubmissionServiceLive = (): EmailSubmissionServiceInterface => {
  const get: EmailSubmissionServiceInterface["get"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `emailSubmission-get-${id}`;

      const methodCall: Invocation = ["EmailSubmission/get", args, callId];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "EmailSubmission/get",
        callId,
        EmailSubmissionGetResponse,
      );
    });

  const set: EmailSubmissionServiceInterface["set"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `emailSubmission-set-${id}`;

      const methodCall: Invocation = ["EmailSubmission/set", args, callId];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "EmailSubmission/set",
        callId,
        EmailSubmissionSetResponse,
      );
    });

  const query: EmailSubmissionServiceInterface["query"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `emailSubmission-query-${id}`;

      const methodCall: Invocation = ["EmailSubmission/query", args, callId];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "EmailSubmission/query",
        callId,
        EmailSubmissionQueryResponse,
      );
    });

  const queryChanges: EmailSubmissionServiceInterface["queryChanges"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `emailSubmission-queryChanges-${id}`;

      const methodCall: Invocation = [
        "EmailSubmission/queryChanges",
        args,
        callId,
      ];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "EmailSubmission/queryChanges",
        callId,
        EmailSubmissionQueryChangesResponse,
      );
    });

  const changes: EmailSubmissionServiceInterface["changes"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `emailSubmission-changes-${id}`;

      const methodCall: Invocation = ["EmailSubmission/changes", args, callId];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "EmailSubmission/changes",
        callId,
        EmailSubmissionChangesResponse,
      );
    });

  const send: EmailSubmissionServiceInterface["send"] = (
    accountId,
    identityId,
    emailId,
    options = {},
  ) =>
    Effect.gen(function* () {
      const submission = EmailSubmissionHelpers.createSubmission(
        identityId,
        emailId,
        options,
      );

      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const result = yield* set({
        accountId,
        create: {
          [`submission-${id}`]: submission,
        },
      });

      // Return the first created submission
      if (result.created) {
        const submissions = Object.values(result.created);
        if (submissions.length > 0) {
          const createdSubmission = submissions[0];
          if (createdSubmission) {
            return createdSubmission;
          }
        }
      }

      // If creation failed, throw an error
      if (result.notCreated) {
        const errors = Object.values(result.notCreated);
        return yield* Effect.die(
          new Error(`Failed to send email: ${JSON.stringify(errors[0])}`)
        );
      }

      return yield* Effect.die(
        new Error("Unexpected response from EmailSubmission/set")
      );
    });

  const getDeliveryStatus: EmailSubmissionServiceInterface["getDeliveryStatus"] = (
    accountId,
    submissionId,
  ) =>
    Effect.gen(function* () {
      const result = yield* get({
        accountId,
        ids: [submissionId],
        properties: ["id", "deliveryStatus", "undoStatus"],
      });

      return result.list[0];
    });

  const cancelScheduled: EmailSubmissionServiceInterface["cancelScheduled"] = (
    accountId,
    submissionId,
  ) =>
    Effect.gen(function* () {
      const result = yield* set({
        accountId,
        update: {
          [submissionId]: {
            undoStatus: "canceled",
          },
        },
      });

      if (result.updated && result.updated[submissionId]) {
        return result.updated[submissionId];
      }

      if (result.notUpdated && result.notUpdated[submissionId]) {
        throw new Error(
          `Failed to cancel submission: ${JSON.stringify(result.notUpdated[submissionId])}`,
        );
      }

      return undefined;
    });

  const getByEmailId: EmailSubmissionServiceInterface["getByEmailId"] = (
    accountId,
    emailId,
  ) =>
    Effect.gen(function* () {
      const queryResult = yield* query({
        accountId,
        filter: {
          emailIds: [emailId],
        },
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      const getResult = yield* get({
        accountId,
        ids: queryResult.ids,
      });

      return getResult.list;
    });

  const getRecent: EmailSubmissionServiceInterface["getRecent"] = (
    accountId,
    limit = 10,
  ) =>
    Effect.gen(function* () {
      const queryResult = yield* query({
        accountId,
        sort: [{ property: "sendAt", isAscending: false }],
        limit: Common.createUnsignedInt(limit),
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      const getResult = yield* get({
        accountId,
        ids: queryResult.ids,
      });

      return getResult.list;
    });

  return {
    get,
    set,
    query,
    queryChanges,
    changes,
    send,
    getDeliveryStatus,
    cancelScheduled,
    getByEmailId,
    getRecent,
  };
};

/**
 * Live layer for EmailSubmission Service
 * Dependencies: IdGenerator (required at runtime by service methods)
 */
export const EmailSubmissionServiceLive = Layer.effect(
  EmailSubmissionService,
  Effect.sync(makeEmailSubmissionServiceLive)
);

/**
 * Convenience functions for common email submission operations
 */
export const EmailSubmissionOperations = {
  /**
   * Send an email immediately with default settings
   */
  sendNow: (accountId: string, identityId: Id, emailId: Id) =>
    Effect.gen(function* () {
      const service = yield* EmailSubmissionService;
      return yield* service.send(accountId, identityId, emailId);
    }),

  /**
   * Send an email at a specific time
   */
  sendLater: (
    accountId: string,
    identityId: Id,
    emailId: Id,
    sendAt: JMAPDate,
  ) =>
    Effect.gen(function* () {
      const service = yield* EmailSubmissionService;
      return yield* service.send(accountId, identityId, emailId, { sendAt });
    }),

  /**
   * Send email and mark original as answered
   */
  sendReply: (
    accountId: string,
    identityId: Id,
    emailId: Id,
    originalEmailId: Id,
  ) =>
    Effect.gen(function* () {
      const service = yield* EmailSubmissionService;
      return yield* service.send(accountId, identityId, emailId, {
        onSuccessUpdateEmail: {
          [originalEmailId]: {
            keywords: { $answered: true },
          },
        },
      });
    }),

  /**
   * Send email and delete draft
   */
  sendAndDeleteDraft: (
    accountId: string,
    identityId: Id,
    emailId: Id,
  ) =>
    Effect.gen(function* () {
      const service = yield* EmailSubmissionService;
      return yield* service.send(accountId, identityId, emailId, {
        onSuccessDestroyEmail: [emailId],
      });
    }),

  /**
   * Get pending submissions that can be canceled
   */
  getPendingSubmissions: (accountId: string) =>
    Effect.gen(function* () {
      const service = yield* EmailSubmissionService;
      const queryResult = yield* service.query({
        accountId,
        filter: {
          undoStatus: "pending",
        },
      });

      if (queryResult.ids.length === 0) {
        return [];
      }

      const getResult = yield* service.get({
        accountId,
        ids: queryResult.ids,
      });

      return getResult.list;
    }),

  /**
   * Get failed submissions
   */
  getFailedSubmissions: (accountId: string) =>
    Effect.gen(function* () {
      const service = yield* EmailSubmissionService;
      const recent = yield* service.getRecent(accountId, 100);

      // Filter for submissions with failed delivery
      return recent.filter((submission) =>
        EmailSubmissionHelpers.hasFailures(submission),
      );
    }),

  /**
   * Retry a failed submission
   */
  retrySubmission: (
    accountId: string,
    identityId: Id,
    emailId: Id,
    originalSubmissionId: Id,
  ) =>
    Effect.gen(function* () {
      const service = yield* EmailSubmissionService;

      // Get the original submission to copy envelope if exists
      const original = yield* service.getDeliveryStatus(
        accountId,
        originalSubmissionId,
      );

      const options = original?.envelope ? { envelope: original.envelope } : {};

      return yield* service.send(accountId, identityId, emailId, options);
    }),
};
