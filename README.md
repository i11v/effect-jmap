# Effect JMAP

A TypeScript implementation of the [JMAP](https://jmap.io) protocol for Mail (RFC 8621).

## Features

- Implements RFC 8621 JMAP for Mail with session discovery and batch optimization
- Built on Effect-TS for type-safe error handling and composable operations
- Fully API-agnostic - no hardcoded endpoints or environment variables
- All configuration passed as parameters

## Installation

```bash
pnpm add effect-jmap
```

## Usage

The library requires you to provide the JMAP session URL and bearer token as configuration parameters:

```typescript
import { Effect, Layer } from 'effect'
import { NodeHttpClient } from '@effect/platform-node'
import {
  createJMAPClient,
  MailboxService,
  MailboxServiceLive,
  JMAPClientService
} from 'effect-jmap'

// Create the client layer with your JMAP server configuration
const JMAPClientLayer = createJMAPClient(
  'https://api.fastmail.com/jmap/session',  // Your JMAP session URL
  'your-bearer-token-here'                   // Your authentication token
)

// Compose layers (include service layers you need)
const MainLayer = Layer.mergeAll(
  NodeHttpClient.layerUndici,
  JMAPClientLayer,
  MailboxServiceLive  // Add service layers as needed
)

// Use the services
const program = Effect.gen(function* () {
  // Get session to find account ID
  const jmapClient = yield* JMAPClientService
  const sessionInfo = yield* jmapClient.getSession
  const accountId = Object.keys(sessionInfo.accounts)[0]

  // Use mailbox service
  const mailboxService = yield* MailboxService
  const mailboxes = yield* mailboxService.getAll(accountId)

  console.log(`Found ${mailboxes.length} mailboxes`)
})

// Run the program
Effect.runPromise(program.pipe(Effect.provide(MainLayer)))
