/**
 * Mock payment-reminder log.
 *
 * Only `src/api/services/fees-collection-service.ts` should import this — it
 * stands in for a backend table.
 */

export { listReminders, recordReminder, resetReminders } from './store'
export type { PaymentReminder } from './store'
