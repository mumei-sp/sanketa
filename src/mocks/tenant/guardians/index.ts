/**
 * Mock guardian directory.
 *
 * Only `src/api/services/guardian-service.ts`, `student-service` (which
 * reconciles the student form's guardian slots into these tables, the way the
 * backend will inside one transaction) and the auth mock should import this —
 * it stands in for two backend tables.
 */

export {
  listGuardians,
  findGuardian,
  listLinks,
  guardiansOfStudent,
  studentsOfGuardian,
  createGuardian,
  updateGuardian,
  linkGuardian,
  unlinkGuardian,
  reconcileGuardians,
} from './store'
export type { Guardian, StudentGuardian, GuardianSlot } from './store'
