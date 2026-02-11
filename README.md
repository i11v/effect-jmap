# Effect JMAP

A TypeScript implementation of the [JMAP](https://jmap.io) protocol for Mail (RFC 8621).

## Features

- Implements RFC 8621 JMAP for Mail with session discovery and batch optimization
- Built on Effect-TS for type-safe error handling and composable operations

## Installation

```bash
pnpm add effect-jmap
```

## Quick Start

The simplest way to use effect-jmap is with the Promise-based client — no Effect knowledge required:

```typescript
import { createJMAPClient } from 'effect-jmap'

const client = await createJMAPClient(
  'https://api.fastmail.com/jmap/session',
  'your-bearer-token-here'
)

// Account ID is auto-discovered
const mailboxes = await client.mailbox.getAll()
console.log(`Found ${mailboxes.length} mailboxes`)

// Query emails
const emails = await client.email.query({
  accountId: client.accountId,
  filter: { inMailbox: 'inbox-id' },
  limit: 10,
})

// Clean up when done
await client.dispose()
```

## Using with Effect

For full control using Effect-TS layers and services:

```typescript
import { Effect } from 'effect'
import {
  JMAPLive,
  MailboxService,
  JMAPClientService
} from 'effect-jmap'

// Create a complete layer with one function call
const mainLayer = JMAPLive(
  'https://api.fastmail.com/jmap/session',
  'your-bearer-token-here'
)

const program = Effect.gen(function* () {
  const jmapClient = yield* JMAPClientService
  const sessionInfo = yield* jmapClient.getSession
  const accountId = Object.keys(sessionInfo.accounts)[0]

  const mailboxService = yield* MailboxService
  const mailboxes = yield* mailboxService.getAll(accountId)

  console.log(`Found ${mailboxes.length} mailboxes`)
})

Effect.runPromise(program.pipe(Effect.provide(mainLayer)))
```

## Advanced Usage

For fine-grained control over the HTTP client, JMAP client configuration, or specific service layers, you can manually compose layers:

```typescript
import { Effect, Layer } from 'effect'
import { NodeHttpClient } from '@effect/platform-node'
import {
  createJMAPClientLayer,
  defaultConfig,
  AppLive,
  MailboxService,
  JMAPClientService
} from 'effect-jmap'

// Option 1: Manual layer composition
const mainLayer = Layer.mergeAll(
  NodeHttpClient.layerUndici,
  createJMAPClientLayer(sessionUrl, bearerToken),
  AppLive  // Includes all services + IdGenerator
)

// Option 2: With custom configuration
const customConfig = {
  ...defaultConfig(sessionUrl, bearerToken),
  timeout: 60000,
  maxRetries: 5,
  userAgent: 'my-app/1.0'
}

const customLayer = Layer.mergeAll(
  NodeHttpClient.layerUndici,
  createJMAPClientLayerWithConfig(customConfig),
  AppLive
)

// Use the same program as above
Effect.runPromise(program.pipe(Effect.provide(mainLayer)))
```

## Contributing

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>(<scope>): <description>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

Commits are validated automatically via husky and commitlint.

### Automated Releases

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and npm publishing:

- Pushes to `main` trigger the release workflow
- Version bumps are determined by commit types:
  - `fix:` commits trigger a **patch** release (1.0.x)
  - `feat:` commits trigger a **minor** release (1.x.0)
  - `BREAKING CHANGE:` in commit body triggers a **major** release (x.0.0)
- Changelog is generated automatically
- GitHub releases are created with release notes
- Package is published to npm automatically

### Required Secrets

For the automated release workflow, configure these repository secrets:

- `NPM_TOKEN`: npm access token with publish permissions
