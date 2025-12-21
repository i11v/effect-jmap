import { Layer } from 'effect'
import { HttpClient } from '@effect/platform'
import { JMAPClientService, JMAPClientLive as JMAPClientLiveImpl, type JMAPClientConfig, defaultConfig } from './client.ts'

/**
 * Re-export the live implementation with the proper layer type
 */
export { JMAPClientLiveImpl as JMAPClientLive }

/**
 * Re-export the default config helper
 */
export { defaultConfig }

/**
 * Re-export the client config interface
 */
export type { JMAPClientConfig }

/**
 * Convenience function to create a live JMAP client layer with default config
 */
export const createJMAPClient = (sessionUrl: string, bearerToken: string): Layer.Layer<JMAPClientService, never, HttpClient.HttpClient> =>
  JMAPClientLiveImpl(defaultConfig(sessionUrl, bearerToken))

/**
 * Convenience function to create a live JMAP client layer with custom config
 */
export const createJMAPClientWithConfig = (config: JMAPClientConfig): Layer.Layer<JMAPClientService, never, HttpClient.HttpClient> =>
  JMAPClientLiveImpl(config)