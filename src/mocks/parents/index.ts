/**
 * Mock parent directory.
 *
 * Only `src/api/services/parent-service.ts` and the auth mock should import
 * this — it stands in for two backend tables.
 */

export {
  listParents,
  listLinks,
  parentsOfStudent,
  studentsOfParent,
  createParent,
  updateParent,
  linkParent,
  unlinkParent,
  resetParents,
} from './store'
export type { Parent, StudentParent } from './store'
