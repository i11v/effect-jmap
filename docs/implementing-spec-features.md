# Implementing JMAP Spec Features

How to implement a new JMAP method (e.g., `Thread/get`).

## Before You Start

1. **Check `tests/config/capabilities.ts`** - The method may already be implemented
2. **Search `tests/spec/`** - Run `grep -r "methodName" tests/spec/` to see existing coverage
3. **Understand `/set` operations** - `create`, `update`, `destroy` are parameters of `/set` methods, not separate methods. If `Email/set` is implemented, destroy is already available.

## Steps

### 1. Enable the capability

Edit `tests/config/capabilities.ts`:

```typescript
'Thread/get': true,  // was false
```

### 2. Run spec tests (they will fail)

```bash
pnpm test:spec
```

Tests for `Thread/get` now run instead of skip. They fail because the method isn't implemented yet.

### 3. Implement the feature

Create or update the service in `src/`. Follow existing patterns:

- `src/thread/schema.ts` - Define schemas (arguments, response types)
- `src/thread/service.ts` - Implement the service with Effect
- `src/thread/index.ts` - Export public API
- Update `src/index.ts` to export the new module

Reference the spec file in `jmap-spec/specs/` for expected behavior.

### 4. Run tests until they pass

```bash
pnpm test:spec
```

### 5. Check coverage

```bash
pnpm coverage:spec --by-type
```

### 6. Commit

```bash
git add .
git commit -m "feat: Implement Thread/get method"
```

## Useful Commands

| Command | Purpose |
|---------|---------|
| `pnpm test:spec` | Run spec compliance tests |
| `pnpm coverage:spec` | Show implementation progress |
| `pnpm coverage:spec --by-type` | Coverage grouped by object |
| `pnpm generate:spec-tests` | Regenerate tests from spec files |

## Current Status

Run `pnpm coverage:spec` to see which methods are implemented.
