import { GradeSheetPage } from '@/features/grades/pages/GradeSheetPage'
import { FamilyGrades } from '@/features/family/pages/FamilyGrades'
import { useFamilyScope } from '@/features/family/FamilyScopeContext'

/**
 * Staff and families get different pages at this route, not the same page
 * narrowed. A school view filtered to one child answers nothing — a register
 * with a single row invites you to mark it, and a class average of one is a
 * number about a person.
 */
export default function GradeSheet() {
  const { isFamily, isStaff } = useFamilyScope()
  // Family *only*. Somebody who is both — the teacher whose child attends —
  // keeps the staff page and reaches her son through the child switcher, rather
  // than trading her job for a parent's view of it.
  return isFamily && !isStaff ? <FamilyGrades /> : <GradeSheetPage />
}
