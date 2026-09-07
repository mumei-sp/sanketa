/**
 * Transport selection.
 *
 * One call site, one flag. Everything above this line is transport-agnostic:
 * the store applies a batch identically whether it was pushed or pulled, which
 * is the property that makes the choice a config value instead of a rewrite.
 */

import { getEnvConfig } from '@/api/utils/env'
import { createSseTransport } from './sse-transport'
import { createPollingTransport } from './polling-transport'
import type { NotificationTransport } from './types'

export function createNotificationTransport(): NotificationTransport {
  return getEnvConfig().notificationTransport === 'poll'
    ? createPollingTransport()
    : createSseTransport()
}

export type { NotificationTransport, TransportContext } from './types'
