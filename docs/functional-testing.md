# Functional Testing Guide

This project uses [Stalwart Mail Server](https://github.com/stalwartlabs/stalwart) for functional testing against a real JMAP implementation.

## Prerequisites

- Docker and Docker Compose
- Node.js and pnpm

## Quick Start

```bash
# 1. Start the test server
pnpm test:server:start

# 2. Seed test data (wait ~10s for server to initialize)
pnpm seed-test-data

# 3. Run functional tests
pnpm test:functional

# 4. Stop when done
pnpm test:server:stop
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm test:server:start` | Start Stalwart container in background |
| `pnpm test:server:stop` | Stop the container |
| `pnpm test:server:logs` | View container logs (useful for debugging) |
| `pnpm test:server:clean` | Remove container and all data |
| `pnpm seed-test-data` | Create test domain and user accounts |
| `pnpm test:functional` | Run functional tests only |
| `pnpm test:all` | Run both unit and functional tests |

## Test Accounts

The seeding script creates the following accounts:

| Username | Password | Email(s) |
|----------|----------|----------|
| testuser | testpassword123 | testuser@test.local |
| alice | alicepassword123 | alice@test.local, alice.smith@test.local |
| bob | bobpassword123 | bob@test.local |

Admin account for management API:
- Username: `admin`
- Password: `test-admin-password`

## Server Configuration

- **JMAP Endpoint**: `http://localhost:8080/.well-known/jmap`
- **Management API**: `http://localhost:8080/api/`
- **Domain**: `test.local`

## Writing Functional Tests

### Using the Stalwart Client

```typescript
import { Effect, Layer } from "effect"
import { NodeHttpClient } from "@effect/platform-node"
import {
  StalwartClientForUser,
  isStalwartAvailable,
} from "./stalwart-client.ts"
import { JMAPClientService } from "../../src/client/client.ts"

// Create a test layer for a specific user
const testLayer = Layer.mergeAll(
  StalwartClientForUser("testuser"),
  NodeHttpClient.layer
)

// Run an effect with the test layer
const result = await Effect.runPromise(
  Effect.gen(function* () {
    const client = yield* JMAPClientService
    const session = yield* client.getSession
    // ... test logic
  }).pipe(Effect.provide(testLayer))
)
```

### Skipping Tests When Server Unavailable

```typescript
import { isStalwartAvailable } from "./stalwart-client.ts"

beforeAll(async () => {
  const isAvailable = await Effect.runPromise(
    isStalwartAvailable().pipe(Effect.provide(NodeHttpClient.layer))
  )
  if (!isAvailable) {
    console.warn("Stalwart server not available, skipping tests")
  }
})
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JMAP_TEST_SERVER_URL` | `http://localhost:8080` | Test server base URL |
| `SKIP_FUNCTIONAL_TESTS` | `false` | Set to `true` to skip functional tests |

## Architecture

```
tests/
├── functional/
│   ├── stalwart-client.ts    # Basic Auth JMAP client for Stalwart
│   └── *.functional.test.ts  # Functional test files
├── unit/                      # Unit tests (mocked)
├── fixtures/                  # Test fixtures
└── utils/                     # Test utilities

scripts/
└── seed-test-data.ts          # Test data seeding script

docker-compose.test.yml        # Stalwart container configuration
```

## Troubleshooting

### Server not starting

Check the logs:
```bash
pnpm test:server:logs
```

### Connection refused

The server takes ~10 seconds to initialize. The seed script will wait automatically, but if running tests manually, ensure the server is ready:

```bash
curl http://localhost:8080/.well-known/jmap
```

### Reset everything

```bash
pnpm test:server:clean
pnpm test:server:start
pnpm seed-test-data
```

### Port already in use

Stop any existing containers:
```bash
docker ps -a | grep stalwart
docker stop <container_id>
docker rm <container_id>
```

## Stalwart Reference

The Stalwart source code is available as a git submodule in the `stalwart/` directory (ignored from git). This is useful for understanding JMAP implementation details:

```bash
# Already cloned, explore the test structure:
ls stalwart/tests/src/jmap/
```

Key files:
- `stalwart/tests/src/jmap/mod.rs` - JMAP test setup
- `stalwart/tests/src/directory/internal.rs` - User creation
- `stalwart/crates/http/src/management/principal.rs` - Management API
