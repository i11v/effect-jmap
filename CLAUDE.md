# Effect JMAP - Claude Code Guide

A TypeScript library implementing RFC 8621 JMAP for Mail using Effect-TS.

## Package Management

- **Always use pnpm** as the package manager (never npm, yarn, or bun)

## Quick Reference

```bash
pnpm install          # Install dependencies
pnpm build            # Build the library (cleans dist/ first)
pnpm test             # Run tests with Vitest
pnpm typecheck        # Type check without emitting
pnpm ci               # Run full CI: typecheck + test + build
pnpm dev              # Watch mode for development
```

## Project Structure

```
src/
├── index.ts              # Main entry point, re-exports all modules
├── core/                 # Core JMAP client and types
│   ├── JMAPClient.ts     # JMAP client service and implementation
│   ├── Types.ts          # RFC 8621 JMAP types (Session, Request, Response)
│   ├── Errors.ts         # Error types (JMAPError, NetworkError, etc.)
│   ├── Capabilities.ts   # JMAP capability URNs
│   ├── EmailUtils.ts     # Email body and keyword utilities
│   ├── ResponseUtils.ts  # Response extraction helpers
│   └── TypeUtils.ts      # Type manipulation utilities
├── schemas/              # Effect Schema definitions for JMAP objects
│   ├── Common.ts         # Shared types (Id, UnsignedInt, Keywords)
│   ├── Mailbox.ts        # Mailbox schema and types
│   ├── Email.ts          # Email schema and types
│   └── EmailSubmission.ts # Email submission schema
├── services/             # Effect services implementing JMAP methods
│   ├── Mailbox.ts        # MailboxService (get, set, query, create, etc.)
│   ├── Email.ts          # EmailService (get, set, query, search, etc.)
│   ├── EmailSubmission.ts # Email sending service
│   ├── IdGenerator.ts    # Unique ID generation service
│   └── index.ts          # AppLive layer combining all services
├── layers/               # Layer composition utilities
│   ├── index.ts          # JMAPLive() helper function
│   ├── JMAPClientLive.ts # Live JMAP client layer
│   └── JMAPClientTest.ts # Test client layer
tests/
├── fixtures/             # Mock JMAP responses
├── utils/test-utils.ts   # Test utilities and mock client
├── unit/                 # Unit tests by module
│   ├── core/
│   ├── schemas/
│   └── services/
└── integration/          # Integration tests
```

## Architecture Patterns

### Effect-TS Patterns

This library uses Effect-TS extensively. Key patterns:

1. **Services via Context.Tag**: Services are defined using `Context.Tag`
   ```typescript
   export class MailboxService extends Context.Tag('MailboxService')<
     MailboxService,
     MailboxServiceInterface
   >() {}
   ```

2. **Layers for dependency injection**: Services are provided via Layer
   ```typescript
   export const MailboxServiceLive = Layer.effect(
     MailboxService,
     Effect.sync(makeMailboxServiceLive)
   )
   ```

3. **Effect generators**: Use `Effect.gen(function* () { ... })` for async operations
   ```typescript
   const result = yield* someEffect
   ```

4. **Schema validation**: Effect Schema for type-safe parsing
   ```typescript
   const session = yield* Schema.decodeUnknown(Session)(jsonData)
   ```

5. **Branded types**: Use Schema.brand for type safety
   ```typescript
   export const Id = Schema.String.pipe(Schema.brand('Id'))
   ```

### Layer Composition

The main entry point is `JMAPLive()` which composes all layers:

```typescript
import { JMAPLive, MailboxService } from 'effect-jmap'

const mainLayer = JMAPLive(sessionUrl, bearerToken)

const program = Effect.gen(function* () {
  const mailboxService = yield* MailboxService
  // Use service...
})

Effect.runPromise(program.pipe(Effect.provide(mainLayer)))
```

For advanced usage, layers can be composed manually using `Layer.mergeAll()`.

### Error Handling

Errors are defined as tagged classes using `Data.TaggedError`:

- `JMAPError` - Base JMAP error
- `NetworkError` - HTTP/network failures
- `AuthenticationError` - Auth failures (401)
- `SessionError` - Session issues
- `JMAPMethodError` - JMAP method-level errors
- `ValidationError` - Schema validation failures
- `ConfigurationError` - Client configuration issues

Use the `Errors` helper for creating errors:
```typescript
Errors.network('Failed to connect', cause)
Errors.authentication('Token expired')
```

## Testing Conventions

Tests use Vitest with Effect-TS patterns:

1. **Test layers**: Create a test layer combining services with mock client
   ```typescript
   const testLayer = Layer.mergeAll(
     MailboxServiceLive,
     testJMAPClient,  // Mock client from test-utils.ts
     IdGeneratorLive
   )
   ```

2. **Running effects in tests**:
   ```typescript
   const result = await TestUtils.runEffectWithLayer(effect, testLayer)
   ```

3. **Mock client**: `testJMAPClient` in `tests/utils/test-utils.ts` provides mock JMAP responses for all methods

4. **Fixtures**: Mock data in `tests/fixtures/jmap-responses.ts`

## Code Style

- Strict TypeScript with `strict: true` and additional checks (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- ES modules with `.js` extensions in imports (for Node ESM compatibility)
- Use `Effect.gen()` for composing effects
- Prefer `Schema.optional()` over nullable union types
- Use branded types for JMAP identifiers (Id, UnsignedInt, State)

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/layers/index.ts` | `JMAPLive()` main entry point |
| `src/core/JMAPClient.ts` | Core client implementation |
| `src/core/Types.ts` | JMAP protocol types |
| `src/services/Mailbox.ts` | Example service implementation |
| `tests/utils/test-utils.ts` | Test utilities and mock client |

## JMAP Protocol Notes

- RFC 8621 implementation for JMAP Mail
- Uses session discovery for API URL
- Supports batch requests for efficiency
- Capabilities: `urn:ietf:params:jmap:core`, `urn:ietf:params:jmap:mail`

## CI/CD

- GitHub Actions workflow in `.github/workflows/publish.yml`
- Triggered on release creation
- Runs `pnpm ci` (typecheck + test + build) before publishing
- Publishes to npm registry
