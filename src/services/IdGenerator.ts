import { Context, Effect, Layer } from "effect"
import crypto from "node:crypto"

/**
 * Service for generating unique identifiers
 */
export interface IdGeneratorInterface {
  readonly generate: Effect.Effect<string>
}

/**
 * IdGenerator context tag
 */
export class IdGenerator extends Context.Tag("@services/IdGenerator")<
  IdGenerator,
  IdGeneratorInterface
>() {}

/**
 * Default implementation using Node.js crypto.randomUUID()
 */
export const IdGeneratorLive = Layer.succeed(
  IdGenerator,
  {
    generate: Effect.sync(() => crypto.randomUUID())
  }
)
