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
  IdentityObject,
  IdentityGetArguments,
  IdentityGetResponse,
  IdentitySetArguments,
  IdentitySetResponse,
  IdentityChangesArguments,
  IdentityChangesResponse,
} from "./schema.ts";
import * as Schema from "effect/Schema";

/**
 * Identity Service Interface
 */
export interface IdentityServiceInterface {
    /**
     * Get identities by ID
     */
    readonly get: (
      args: IdentityGetArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof IdentityGetResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Create, update, or destroy identities
     */
    readonly set: (
      args: IdentitySetArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof IdentitySetResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get changes to identities since a state
     */
    readonly changes: (
      args: IdentityChangesArguments,
    ) => Effect.Effect<
      Schema.Schema.Type<typeof IdentityChangesResponse>,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get all identities for an account
     */
    readonly getAll: (
      accountId: string,
    ) => Effect.Effect<
      readonly IdentityObject[],
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;

    /**
     * Get the default identity (first identity returned)
     */
    readonly getDefault: (
      accountId: string,
    ) => Effect.Effect<
      IdentityObject,
      JMAPMethodError | NetworkError | AuthenticationError | SessionError,
      JMAPClientService | HttpClient.HttpClient | IdGenerator
    >;
}

/**
 * Identity Service Tag
 */
export class IdentityService extends Context.Tag("IdentityService")<
  IdentityService,
  IdentityServiceInterface
>() {}

/**
 * Live implementation of Identity Service
 */
const makeIdentityServiceLive = (): IdentityServiceInterface => {
  const get: IdentityServiceInterface["get"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `identity-get-${id}`;

      const methodCall: Invocation = ["Identity/get", args, callId];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "Identity/get",
        callId,
        IdentityGetResponse,
      );
    });

  const set: IdentityServiceInterface["set"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `identity-set-${id}`;

      const methodCall: Invocation = ["Identity/set", args, callId];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "Identity/set",
        callId,
        IdentitySetResponse,
      );
    });

  const changes: IdentityServiceInterface["changes"] = (args) =>
    Effect.gen(function* () {
      const client = yield* JMAPClientService;
      const idGenerator = yield* IdGenerator;
      const id = yield* idGenerator.generate;
      const callId = `identity-changes-${id}`;

      const methodCall: Invocation = ["Identity/changes", args, callId];

      const response = yield* client.batch([methodCall], [...CAPABILITY_SETS.SUBMISSION]);
      return yield* extractMethodResponse(
        response,
        "Identity/changes",
        callId,
        IdentityChangesResponse,
      );
    });

  const getAll: IdentityServiceInterface["getAll"] = (accountId) =>
    Effect.gen(function* () {
      const result = yield* get({
        accountId,
        ids: null,
      });

      return result.list;
    });

  const getDefault: IdentityServiceInterface["getDefault"] = (accountId) =>
    Effect.gen(function* () {
      const result = yield* get({
        accountId,
        ids: null,
      });

      const first = result.list[0];
      if (!first) {
        return yield* Effect.die(
          new Error("No identities found for account")
        );
      }

      return first;
    });

  return {
    get,
    set,
    changes,
    getAll,
    getDefault,
  };
};

/**
 * Live layer for Identity Service
 * Dependencies: IdGenerator (required at runtime by service methods)
 */
export const IdentityServiceLive = Layer.effect(
  IdentityService,
  Effect.sync(makeIdentityServiceLive)
);
