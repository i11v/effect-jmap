import { Effect, Layer, TestContext } from 'effect'

/**
 * Test utilities for Effect-based testing
 */
export const TestUtils = {
  /**
   * Run an Effect in a test context with proper error handling
   */
  runEffect: async <A, E>(effect: Effect.Effect<A, E>) => {
    return Effect.runPromise(
      Effect.provide(effect, TestContext.TestContext)
    )
  },

  /**
   * Run an Effect with a specific layer for testing
   */
  runEffectWithLayer: async <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    layer: Layer.Layer<R>
  ) => {
    return Effect.runPromise(
      Effect.provide(effect, layer)
    )
  }
}