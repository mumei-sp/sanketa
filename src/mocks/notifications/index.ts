/**
 * Mock notification server.
 *
 * Only `src/api/services/notification-service.ts` should import this — it is
 * the stand-in for a backend, and the app talks to backends through services.
 */

export {
  getSince,
  getAll,
  getUnreadCount,
  publish,
  markRead,
  markAllRead,
  dismiss,
  subscribe,
} from './store'
export { deriveNotification } from './rules'
