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
  return isFamily ? <FamilyAttendance /> : <AttendancePage />
}
