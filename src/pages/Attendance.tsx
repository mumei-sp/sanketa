import { AttendancePage } from '@/features/attendance/pages/AttendancePage'
import { FamilyAttendance } from '@/features/family/pages/FamilyAttendance'
import { useFamilyScope } from '@/features/family/FamilyScopeContext'

/**
 * Staff and families get different pages at this route, not the same page
 * narrowed. A school view filtered to one child answers nothing — a register
 * with a single row invites you to mark it, and a class average of one is a
 * number about a person.
 */
export default function Attendance() {
  const { isFamily } = useFamilyScope()
  // One side at a time. The teacher whose child attends used to be both at
  // once, and this had to break the tie for her — badly, as it turned out,
  // since the child switcher that was meant to carry her to her son renders
  // only inside the family variant this kept her out of. She picks at the door
  // now, so there is no tie left to break.
  return isFamily ? <FamilyAttendance /> : <AttendancePage />
}
