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

Before implementing any JMAP method:

1. **Check `tests/config/capabilities.ts`** - See if the method is already marked as implemented
2. **Search spec tests** - Run `grep -r "methodName" tests/spec/` to see existing coverage
3. **Understand the testing structure**:
   - `tests/spec/` - Auto-generated RFC compliance tests (run via capability flags)
   - `tests/unit/` - Service implementation tests with mocks
   - `tests/functional/` - Integration tests against real Stalwart server

JMAP operations like `create`, `update`, `destroy` are parameters of `/set` methods, not separate methods. Check if the parent method (e.g., `Email/set`) is already implemented before adding new functionality.
