# Implementing JMAP Methods

This guide explains how to implement new JMAP methods in this library, including the testing strategy and common pitfalls.

## Before You Start

### 1. Check Implementation Status

Look at `tests/config/capabilities.ts` to see if the method is already implemented:

```typescript
export const JMAPCapabilities = {
  'Email/get': true,   // implemented
  'Email/set': true,   // implemented
  'Email/parse': false // not implemented
}
```

### 2. Understand JMAP Method Structure

JMAP methods follow patterns defined in RFC 8620/8621:

- **`/get`** - Retrieve objects by ID
- **`/set`** - Create, update, or destroy objects (single method, multiple operations)
- **`/query`** - Search with filters and sorting
- **`/changes`** - Get changes since a state
- **`/queryChanges`** - Get query result changes since a state

**Important**: Operations like `create`, `update`, and `destroy` are parameters of `/set` methods, not separate JMAP methods. If `Email/set` is implemented, the destroy functionality is already available.

### 3. Search Existing Spec Tests

Spec tests are auto-generated from the RFC specifications. Search before implementing:

```bash
grep -r "destroy" tests/spec/
grep -r "Email/set" tests/spec/
```

## Testing Structure

```
tests/
├── spec/           # RFC compliance tests (auto-generated)
├── unit/           # Service implementation tests (mocked)
└── functional/     # Integration tests (real Stalwart server)
```

### Spec Tests (`tests/spec/`)

- Auto-generated from `jmap-spec/` markdown files
- Test RFC compliance using mock responses
- Controlled by `tests/config/capabilities.ts` flags
- Run with: `pnpm test:spec`

### Unit Tests (`tests/unit/`)

- Test service methods with mocked JMAP client
- Located in `tests/unit/services/`
- Use `tests/utils/test-utils.ts` for mocks
- Run with: `pnpm test`

### Functional Tests (`tests/functional/`)

- Test against real Stalwart JMAP server
- For integration scenarios only
- See `docs/functional-testing.md` for setup
- Run with: `pnpm test:functional`

## Implementation Checklist

1. [ ] Check `tests/config/capabilities.ts` for existing implementation
2. [ ] Search `tests/spec/` for existing coverage
3. [ ] Implement service method in `src/<object>/service.ts`
4. [ ] Add unit tests in `tests/unit/services/`
5. [ ] Update mock client in `tests/utils/test-utils.ts` if needed
6. [ ] Mark capability as `true` in `tests/config/capabilities.ts`
7. [ ] Run `pnpm test` and `pnpm test:spec` to verify

## Common Pitfalls

### Creating redundant tests

Spec tests already cover most RFC-defined behavior. Only add:
- Unit tests for convenience methods (e.g., `markRead`, `destroy`)
- Functional tests for complex integration scenarios

### Confusing /set operations with separate methods

Wrong: "I need to implement Email/destroy"
Right: "I need to add a `destroy` convenience method that uses the existing Email/set"

### Not checking capabilities first

Always verify in `capabilities.ts` before starting work. The method may already be implemented.
