# Effect JMAP - Claude Code Guide

A TypeScript library implementing RFC 8621 JMAP for Mail using Effect-TS.

## Package Management

- **Always use pnpm** as the package manager (never npm, yarn, or bun)

## Effect-TS Patterns

This library uses Effect-TS extensively:

1. **Services via Context.Tag**: Services are defined using `Context.Tag`
2. **Layers for dependency injection**: Services are provided via `Layer`
3. **Effect generators**: Use `Effect.gen(function* () { ... })` for async operations
4. **Schema validation**: Effect Schema for type-safe parsing
5. **Branded types**: Use `Schema.brand()` for type safety (e.g., `Id`, `State`)

## Code Style

- ES modules with `.js` extensions in imports (for Node ESM compatibility)
- Errors use `Data.TaggedError` pattern
