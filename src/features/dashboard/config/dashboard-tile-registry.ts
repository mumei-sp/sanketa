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
import { baseColors } from '@/theme/colors'
import type { DashboardStat } from '../types'
import type { TileOption } from '@/components/tile/TileCustomizeModal'
import { studentsData } from '@/mocks/students/students'
import { teachersData } from '@/mocks/teachers/teachers'

// Student / teacher counts derive from the canonical mocks. The mocks ship
// small demo datasets (~40 students, ~18 teachers); these multipliers scale
// them up to what a real Sanketa campus would report (~1,200 students, ~90
// faculty), so the dashboard reads plausibly without losing the link to the
// underlying seed data.
const ENROLLMENT_MULTIPLIER = 30
const FACULTY_MULTIPLIER = 5

/**
 * Full registry of available dashboard stat tiles (15 options).
 * Each page that uses configurable tiles defines its own registry.
 */
export const dashboardTileRegistry: DashboardStat[] = [
  // ── Students ──
  {
    id: 'enrolled-students',
    label: 'Enrolled Students',
    value: studentsData.length * ENROLLMENT_MULTIPLIER,
    description: 'Total active students',
    icon: GraduationCap,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'new-admissions',
    label: 'New Admissions',
    value: 28,
    description: 'This month',
    icon: UserPlus,
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
  },
  {
    id: 'students-on-leave',
    label: 'Students on Leave',
    value: 12,
    description: 'Currently on leave',
    icon: UserX,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },

  // ── Teachers ──
  {
    id: 'active-teachers',
    label: 'Active Teachers',
    value: teachersData.length * FACULTY_MULTIPLIER,
    description: 'Full & part-time',
    icon: Users,
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
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
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
  },

  // ── Finance ──
  {
    id: 'fees-collected',
    label: 'Fees Collected',
    value: 245000,
    description: 'This month',
    icon: DollarSign,
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
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
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
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
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
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
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
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
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
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
