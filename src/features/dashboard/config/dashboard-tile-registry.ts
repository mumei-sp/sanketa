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
import type { TileOption } from '@/components/tile/TileCustomizeModal'
import { listStudents, studentCount } from '@/mocks/students'
import { teachersData } from '@/mocks/teachers/teachers'

// Counts come from the tables. They used to be the seed size times a
// multiplier — 40 × 30 for students, 18 × 5 for faculty — which put "1,200
// Enrolled Students" above a directory holding forty, and every tile the
// dashboard offered disagreed with the screen it linked to. The roster is
// generated at the size of a school now, so a tile can simply count.
const roster = listStudents()

/** On the register but away — a term's illness, a family posted out. */
const onLeave = roster.filter(student => student.status === 'On Leave').length

/**
 * Admitted since this academic year began.
 *
 * April because that is what the school config calls the year start. A
 * generated roster admits most of its students in June of their class-1 year
 * and a few mid-way through, so this counts the transfers-in as well as the
 * new class 1 — which is what a school means by new admissions.
 */
const newAdmissions = (() => {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 3, 1)
  if (now < yearStart) yearStart.setFullYear(now.getFullYear() - 1)
  return roster.filter(student => {
    if (!student.admissionDate) return false
    return new Date(student.admissionDate) >= yearStart
  }).length
})()

/**
 * Full registry of available dashboard stat tiles (15 options).
 * Each page that uses configurable tiles defines its own registry.
 */
export const dashboardTileRegistry: DashboardStat[] = [
  // ── Students ──
  {
    id: 'enrolled-students',
    label: 'Enrolled Students',
    value: studentCount(),
    description: 'Total active students',
    icon: GraduationCap,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'new-admissions',
    label: 'New Admissions',
    value: newAdmissions,
    description: 'This academic year',
    icon: UserPlus,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
  },
  {
    id: 'students-on-leave',
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
    label: 'Active Teachers',
    value: teachersData.length,
    description: 'Full & part-time',
    icon: Users,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
  },
  {
    id: 'full-time-teachers',
    label: 'Full-Time Teachers',
    value: 62,
    description: 'Permanent staff',
    icon: Briefcase,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'substitute-teachers',
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
    label: 'Fees Collected',
    value: 245000,
    description: 'This month',
    icon: DollarSign,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
  },
  {
    id: 'pending-fees',
    label: 'Pending Fees',
    value: 38500,
    description: 'Outstanding amount',
    icon: CreditCard,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'monthly-expenses',
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
    label: "Today's Attendance",
    value: 94,
    description: 'Percentage present',
    icon: CheckCircle,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'absent-today',
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
    label: 'Support Staff',
    value: 34,
    description: 'Non-teaching staff',
    icon: UserCog,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'total-awards',
    label: 'Total Awards',
    value: 152,
    description: 'All-time awards',
    icon: Award,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
  },
  {
    id: 'upcoming-events',
    label: 'Upcoming Events',
    value: 5,
    description: 'Next 7 days',
    icon: Calendar,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'assignments-due',
    label: 'Assignments Due',
    value: 12,
    description: 'This week',
    icon: ClipboardList,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
  },
]

/** Default tiles shown to new users (matches the original hardcoded dashboard) */
export const DEFAULT_DASHBOARD_TILE_IDS = [
  'enrolled-students',
  'active-teachers',
  'support-staff',
  'total-awards',
]

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
