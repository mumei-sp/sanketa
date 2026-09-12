/**
 * Dashboard Tile Registry
 *
 * Defines all available KPI tiles that can appear at the top of the dashboard.
 * Admins select 3-4 from this pool via the customize modal.
 *
 * When backend is ready, values can be fetched dynamically via a service function.
 * The registry structure (id, label, icon, colors) stays the same.
 */

import {
  GraduationCap,
  Users,
  UserCog,
  Award,
  UserPlus,
  UserX,
  Briefcase,
  UserCheck,
  DollarSign,
  CreditCard,
  TrendingDown,
  CheckCircle,
  XCircle,
  Calendar,
  ClipboardList,
} from 'lucide-react'
import type { DashboardStat } from '../types'
import type { Permission } from '@/config/permissions'
import type { TileOption } from '@/components/tile/TileCustomizeModal'
import { listStudents, studentCount } from '@/mocks/tenant/students'
import { teachersData } from '@/mocks/tenant/teachers/teachers'
import { listStaff } from '@/mocks/tenant/profiles/store'

/**
 * Admitted since this academic year began.
 *
 * April because that is what the school config calls the year start. A
 * generated roster admits most of its students in June of their class-1 year
 * and a few mid-way through, so this counts the transfers-in as well as the
 * new class 1 — which is what a school means by new admissions.
 */
function countNewAdmissions(roster: ReturnType<typeof listStudents>): number {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 3, 1)
  if (now < yearStart) yearStart.setFullYear(now.getFullYear() - 1)
  return roster.filter(student => {
    if (!student.admissionDate) return false
    return new Date(student.admissionDate) >= yearStart
  }).length
}

/**
 * The tiles, counted when they are asked for.
 *
 * Counts come from the tables. They used to be the seed size times a
 * multiplier — 40 × 30 for students, 18 × 5 for faculty — which put "1,200
 * Enrolled Students" above a directory holding forty, and every tile the
 * dashboard offered disagreed with the screen it linked to. The roster is
 * generated at the size of a school now, so a tile can simply count.
 *
 * A FUNCTION, not the constant this was, because the stores it counts are
 * per-school and empty themselves when the active school changes — see
 * `onTenantSwitch` in `_shared/tenant-context`. Read once at module load, the
 * numbers were whichever school happened to be active when the bundle was
 * first imported, and switching schools left the previous one's enrolment
 * sitting above the new one's directory. The dashboard rebuilds this when the
 * school changes.
 *
 * `teachersData` is still a module-scope snapshot of its own fixtures, so the
 * two teacher counts below do NOT yet follow a switch. Fixing that means giving
 * the teachers mock a tenant-aware read, the way `listStudents` has one.
 */
export function buildDashboardTileRegistry(): DashboardStat[] {
  const roster = listStudents()
  /** On the register but away — a term's illness, a family posted out. */
  const onLeave = roster.filter(student => student.status === 'On Leave').length
  const newAdmissions = countNewAdmissions(roster)

  return [
    // ── Students ──
    {
      id: 'enrolled-students',
      permission: 'students.read',
      label: 'Enrolled Students',
      value: studentCount(),
      description: 'Total active students',
      icon: GraduationCap,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'new-admissions',
      permission: 'students.read',
      label: 'New Admissions',
      value: newAdmissions,
      description: 'This academic year',
      icon: UserPlus,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },
    {
      id: 'students-on-leave',
      permission: 'students.read',
      label: 'Students on Leave',
      value: onLeave,
      description: 'Currently on leave',
      icon: UserX,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },

    // ── Teachers ──
    {
      id: 'active-teachers',
      permission: 'teachers.read',
      label: 'Active Teachers',
      value: teachersData.length,
      description: 'Full & part-time',
      icon: Users,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },
    {
      id: 'full-time-teachers',
      permission: 'teachers.read',
      label: 'Full-Time Teachers',
      value: 62,
      description: 'Permanent staff',
      icon: Briefcase,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'substitute-teachers',
      permission: 'teachers.read',
      label: 'Substitute Teachers',
      value: 6,
      description: 'Temporary staff',
      icon: UserCheck,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },

    // ── Finance ──
    {
      id: 'fees-collected',
      permission: 'finance.read',
      label: 'Fees Collected',
      value: 245000,
      description: 'This month',
      icon: DollarSign,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },
    {
      id: 'pending-fees',
      permission: 'finance.read',
      label: 'Pending Fees',
      value: 38500,
      description: 'Outstanding amount',
      icon: CreditCard,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'monthly-expenses',
      permission: 'finance.read',
      label: 'Monthly Expenses',
      value: 125000,
      description: 'This month',
      icon: TrendingDown,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },

    // ── Attendance ──
    {
      id: 'today-attendance',
      permission: 'attendance.read',
      label: "Today's Attendance",
      value: 94,
      description: 'Percentage present',
      icon: CheckCircle,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'absent-today',
      permission: 'attendance.read',
      label: 'Absent Today',
      value: 18,
      description: 'Students absent',
      icon: XCircle,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },

    // ── General ──
    {
      id: 'support-staff',
      permission: 'teachers.read',
      label: 'Support Staff',
      // Counted, not typed. It said 34 — which was fiction until `teachers`
      // started extending `staff`, and then became a number that happened to
      // match the staff table while meaning something else: 31 teachers plus 3
      // in the office. "Non-teaching staff" is an employment record with no
      // `teachers` row.
      value: listStaff().filter(
        record => !teachersData.some(teacher => String(teacher.id) === record.profileId),
      ).length,
      description: 'Non-teaching staff',
      icon: UserCog,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'total-awards',
      permission: 'dashboard.read',
      label: 'Total Awards',
      value: 152,
      description: 'All-time awards',
      icon: Award,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },
    {
      id: 'upcoming-events',
      permission: 'calendar.read',
      label: 'Upcoming Events',
      value: 5,
      description: 'Next 7 days',
      icon: Calendar,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'assignments-due',
      permission: 'assignments.read',
      label: 'Assignments Due',
      value: 12,
      description: 'This week',
      icon: ClipboardList,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },
  ]
}

/** Default tiles shown to new users (matches the original hardcoded dashboard) */
export const DEFAULT_DASHBOARD_TILE_IDS = [
  'enrolled-students',
  'active-teachers',
  'support-staff',
  'total-awards',
]

/**
 * The tiles this caller may be shown.
 *
 * A tile is a number about something, and a number is a read. A Librarian
 * holding four read permissions was still offered "Fees Collected" and
 * "Enrolled Students" — and the registry computes its values off the stores
 * directly, so those were the school's real figures rather than the zeroes the
 * services would have returned.
 *
 * Filtered the same way navigation is, by `can`, so a role invented tomorrow
 * gets a dashboard of the tiles it can fill without anybody listing them. The
 * customize modal is filtered with it too: offering a tile that would be
 * refused is a menu with dishes that are off.
 *
 * `useTileSelection` drops stored ids that are not in the registry it is given,
 * so a person whose permission is taken away loses the tile on their next load
 * rather than keeping a stale pick.
 *
 * ── What this is not ──────────────────────────────────────────────────
 * A boundary. `can` with a bare permission asks "anywhere?", which a caller
 * narrowed to their own records answers yes to — and the values above are
 * computed off the stores rather than through the services, so they are the
 * school's real figures and not the zeroes `callerSeesEveryRow` would return.
 * A family never reaches this page (`Dashboard` sends them to `FamilyHome`,
 * and the active side decides which), so the two together hold. If a family
 * role ever did land here, the fix is to read these through the services, not
 * to tighten the filter.
 */
export function visibleTiles(
  registry: DashboardStat[],
  can: (permission: Permission) => boolean,
): DashboardStat[] {
  return registry.filter(tile => !tile.permission || can(tile.permission))
}

/** Convert DashboardStat items to TileOption for the customize modal */
export function toTileOptions(registry: DashboardStat[]): TileOption[] {
  return registry.map(stat => ({
    id: stat.id,
    label: stat.label,
    icon: stat.icon,
    iconBg: stat.iconBg,
    iconColor: stat.iconColor,
    description: stat.description,
  }))
}
