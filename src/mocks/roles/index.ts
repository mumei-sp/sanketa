/**
 * Mock role server.
 *
 * Only `src/api/services/role-service.ts` should import this — it stands in
 * for a backend, and the app talks to backends through services.
 */

export {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  restoreRole,
  resetRoles,
} from './store'
