// Client service and configuration
export {
  JMAPClientService,
  JMAPClientLive,
  defaultConfig,
  type JMAPClientConfig,
  type JMAPClientInterface,
  type JMAPClient,
} from './client.ts'

// Live layer factory
export {
  JMAPClientLive as JMAPClientLiveImpl,
  createJMAPClient,
  createJMAPClientWithConfig,
  type JMAPClientConfig as JMAPConfig,
} from './live.ts'

// Test layer factory
export {
  JMAPClientTest,
  defaultTestConfig,
  withMockResponses,
  withErrors,
  withDelay,
  type JMAPTestConfig,
} from './test.ts'

// Core types
export type {
  Session,
  Account,
  Capability,
  Request,
  Response,
  Invocation,
  MethodResponse,
} from './types.ts'

// Errors
export {
  SessionError,
  NetworkError,
  AuthenticationError,
  JMAPMethodError,
  Errors,
  type MethodError,
} from './errors.ts'

// Capabilities
export { JMAP_CAPABILITIES, CAPABILITY_SETS, type JMAPCapability, type CapabilitySet } from './capabilities.ts'

// Response utilities
export { extractMethodResponse } from './response-utils.ts'
