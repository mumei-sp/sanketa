/**
 * Mock parent directory.
 *
 * Only `src/api/services/parent-service.ts`, `student-service` (which
 * reconciles the student form's guardian slots into these tables, the way the
 * backend will inside one transaction) and the auth mock should import this —
 * it stands in for two backend tables.
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
  reconcileGuardians,
  resetParents,
} from './store'
export type { Parent, StudentParent, GuardianSlot } from './store'
