/**
 * Mock audit log.
 *
 * Only `src/api/services/access-log-service.ts` should import this — it stands
 * in for a backend table.
 */

export { listEvents, recordEvent, resetEvents } from './store'
export type { AccessEvent, AccessEventKind, AccessChange, AccessEntity } from './store'
