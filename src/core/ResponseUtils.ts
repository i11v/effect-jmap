import { Effect } from 'effect'
import * as Schema from 'effect/Schema'
import { JMAPMethodError } from './Errors.ts'
import { Response, MethodResponse } from './Types.ts'

/**
 * Extract and validate a method response from a JMAP batch response
 */
export const extractMethodResponse = <A, I, R>(
  response: Response,
  methodName: string,
  callId: string,
  schema: Schema.Schema<A, I, R>,
): Effect.Effect<A, JMAPMethodError, R> => {
  if (!response.methodResponses) {
    return Effect.fail(
      JMAPMethodError.fromMethodError(
        {
          type: "invalidArguments",
          description: "No method responses in JMAP response",
        },
        callId,
      ),
    );
  }

  const methodResponse = response.methodResponses.find(
    ([name, _, id]: MethodResponse) =>
      name === methodName && id === callId,
  );

  if (!methodResponse) {
    return Effect.fail(
      JMAPMethodError.fromMethodError(
        {
          type: "serverFail",
          description: `Method response not found for ${methodName}`,
        },
        callId,
      ),
    );
  }

  const [, result] = methodResponse;

  return Schema.decodeUnknown(schema)(result).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        JMAPMethodError.fromMethodError(
          {
            type: "serverFail",
            description: `Invalid response format: ${error}`,
          },
          callId,
        ),
      ),
    ),
  );
};
