# Effect JMAP - Project Rules

A TypeScript library implementing RFC 8621 JMAP for Mail using Effect-TS.

## Package Management

- Always use pnpm as the package manager (never npm, yarn, or bun)
- Use `pnpm dlx` instead of `npx` for one-off commands

## Effect-TS Patterns

1. **Services via Context.Tag**: Services are defined using `Context.Tag`
2. **Layers for dependency injection**: Services are provided via `Layer`
3. **Effect generators**: Use `Effect.gen(function* () { ... })` for async operations
4. **Schema validation**: Effect Schema for type-safe parsing
5. **Branded types**: Use `Schema.brand()` for type safety (e.g., `Id`, `State`)

## Code Style

- ES modules with `.js` extensions in imports (for Node ESM compatibility)
- Errors use `Data.TaggedError` pattern

## Commit Messages

- **Sentence-case** subjects: `fix: Correct the return type` (not `fix: correct...`)
- No "Generated with" banners or co-author attributions

## Implementing JMAP Methods

See `docs/implementing-jmap-methods.md` for the full guide. Key points:

1. Check `tests/config/capabilities.ts` before starting
2. Search `tests/spec/` for existing coverage
3. Operations like `create`, `update`, `destroy` are `/set` parameters, not separate methods
