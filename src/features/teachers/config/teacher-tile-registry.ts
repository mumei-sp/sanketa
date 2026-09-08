/**
 * Teacher Page Tile Registry
 *
 * Defines all available KPI tiles for the teachers page.
 * Admins select up to 4 from this pool via the customize modal.
 */

import {
  Users,
  Clock,
  RefreshCw,
  UserCheck,
  UserX,
  GraduationCap,
  Award,
  Briefcase,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TileOption } from '@/components/tile/TileCustomizeModal'
import type { TeacherStatistics } from '@/features/teachers/types'

export interface TeacherTileConfig {
  id: string
  label: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  description: string
  /** Function to resolve the value from the statistics data */
  getValue: (stats: TeacherStatistics) => number
}

export const teacherTileRegistry: TeacherTileConfig[] = [
  {
    id: 'total-teachers',
    label: 'Total Teachers',
    icon: Users,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
    description: 'All teaching staff',
    getValue: stats => stats.total,
  },
  {
    id: 'full-time',
    label: 'Full-Time Teacher',
    icon: Clock,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
    description: 'Permanent staff',
    getValue: stats => stats.fullTime,
  },
  {
    id: 'part-time',
    label: 'Part-Time Teacher',
    icon: Clock,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
    description: 'Part-time contracts',
    getValue: stats => stats.partTime,
  },
  {
    id: 'substitute',
    label: 'Substitute Teacher',
    icon: RefreshCw,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
    description: 'Temporary staff',
    getValue: stats => stats.substitute,
  },
  {
    id: 'present-today',
    label: 'Present Today',
    icon: UserCheck,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
    description: 'Checked in today',
    getValue: () => 78,
  },
  {
    id: 'on-leave',
    label: 'On Leave',
    icon: UserX,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
    description: 'Currently on leave',
    getValue: () => 4,
  },
  {
    id: 'avg-experience',
    label: 'Avg. Experience',
    icon: Briefcase,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
    description: 'Years of experience',
    getValue: () => 8,
  },
  {
    id: 'certified-teachers',
    label: 'Certified Teachers',
    icon: Award,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
    description: 'With certifications',
    getValue: () => 71,
  },
  {
    id: 'classes-today',
    label: 'Classes Today',
    icon: GraduationCap,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
    description: 'Scheduled classes',
    getValue: () => 42,
  },
  {
    id: 'performance-reviews',
    label: 'Reviews Due',
    icon: TrendingUp,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
    description: 'Pending reviews',
    getValue: () => 9,
  },
]

/** Default tiles matching the original hardcoded dashboard */
export const DEFAULT_TEACHER_TILE_IDS = [
  'total-teachers',
  'full-time',
  'part-time',
  'substitute',
]

/** Convert registry items to TileOption for the customize modal */
export function toTeacherTileOptions(registry: TeacherTileConfig[]): TileOption[] {
  return registry.map(tile => ({
    id: tile.id,
    label: tile.label,
    icon: tile.icon,
    iconBg: tile.iconBg,
    iconColor: tile.iconColor,
    description: tile.description,
  }))
}
