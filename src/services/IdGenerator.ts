import { Context, Effect, Layer } from "effect"
import crypto from "node:crypto"

/**
 * Service for generating unique identifiers
 */
export interface IdGenerator {
  readonly generate: Effect.Effect<string>
}

/**
 * IdGenerator context tag
 */
export const IdGenerator = Context.GenericTag<IdGenerator>("@services/IdGenerator")

/**
 * Default implementation using Node.js crypto.randomUUID()
 */
export const IdGeneratorLive = Layer.succeed(
  IdGenerator,
  IdGenerator.of({
    generate: Effect.sync(() => crypto.randomUUID())
  })
)
