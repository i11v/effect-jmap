import * as Schema from 'effect/Schema'
import { Id, UnsignedInt } from '../schemas/Common.ts'

/**
 * Type-safe utilities for working with branded types
 */

/**
 * Create a branded Id from a string (with validation)
 */
export const createId = (value: string): Id =>
  Schema.decodeSync(Id)(value)

/**
 * Create a branded UnsignedInt from a number (with validation)
 */
export const createUnsignedInt = (value: number): UnsignedInt =>
  Schema.decodeSync(UnsignedInt)(value)

/**
 * Safely convert an array of strings to branded Ids
 */
export const createIdArray = (values: readonly string[]): readonly Id[] =>
  values.map(createId)

/**
 * Create a new keywords object (immutable helper)
 */
export const updateKeywords = (
  currentKeywords: { readonly [x: string]: boolean } | undefined,
  updates: Record<string, boolean>
): { readonly [x: string]: boolean } => {
  return {
    ...(currentKeywords || {}),
    ...updates
  }
}

/**
 * Create a new filter object with updates (immutable helper)
 */
export const updateFilter = <T extends Record<string, unknown>>(
  currentFilter: T,
  updates: Partial<T>
): T => {
  return {
    ...currentFilter,
    ...updates
  }
}
