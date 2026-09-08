/**
 * Mock user directory.
 *
 * Only `src/api/services/user-service.ts` and the auth mock should import
 * this — it stands in for a backend table.
 */

export { listUsers, findByEmail, createUser, updateUser, resetUsers } from './store'
export type { SchoolUser } from './store'
