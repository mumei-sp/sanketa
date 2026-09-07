/**
 * Turning a stored notification into something to look at.
 *
 * Kept out of the data on purpose. The dashboard's old activity feed baked
 * `iconBg` and `iconColor` into every record, so each stored row carried a
 * frozen copy of the palette and a theme change would have needed a data
 * migration. Deriving here instead means the brand can move and history
 * follows.
 *
 * Colours come from the existing `status` tokens and brand CSS variables — no
 * new palette, so notifications read as part of the app rather than beside it.
 */

import {
  CalendarCheck,
  GraduationCap,
  Receipt,
  Megaphone,
  Users,
  Clock,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { colors, withOpacity } from '@/theme/colors'
import type { NotificationCategory, NotificationSeverity } from '../types'

interface CategoryStyle {
  icon: LucideIcon
  /** Human label, used in filters and screen-reader text. */
  label: string
}

const CATEGORY_STYLES: Record<NotificationCategory, CategoryStyle> = {
  attendance: { icon: CalendarCheck, label: 'Attendance' },
  grades: { icon: GraduationCap, label: 'Grades' },
  finance: { icon: Receipt, label: 'Finance' },
  notices: { icon: Megaphone, label: 'Notices' },
  people: { icon: Users, label: 'People' },
  timetable: { icon: Clock, label: 'Schedule' },
  system: { icon: Settings, label: 'System' },
}

/**
 * Severity drives the colour, category drives the glyph.
 *
 * Splitting them this way means "payment recorded" and "payment overdue" share
 * an icon so the eye groups them, while colour still separates good news from
 * bad — which is the distinction someone scanning a feed actually needs.
 */
const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  info: 'var(--heading)',
  success: colors.status.success.base,
  warning: colors.status.warning.base,
  critical: colors.status.danger.base,
}

export function getCategoryIcon(category: NotificationCategory): LucideIcon {
  return CATEGORY_STYLES[category].icon
}

export function getCategoryLabel(category: NotificationCategory): string {
  return CATEGORY_STYLES[category].label
}

export function getSeverityColor(severity: NotificationSeverity): string {
  return SEVERITY_COLORS[severity]
}

/** Tint for the icon medallion — the severity colour at card-surface strength. */
export function getSeverityTint(severity: NotificationSeverity): string {
  return withOpacity(SEVERITY_COLORS[severity], 0.12)
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * "just now" / "12m" / "3h" / "2d", then a date once it stops being useful.
 *
 * Deliberately terse: this sits at the end of a row that already has a title
 * and a body competing for a phone's width, and "about 3 hours ago" buys
 * nothing over "3h" at that size.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime()

  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d`

  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Full timestamp for the `title` attribute, where there is room to be exact. */
export function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export type DayGroup = 'Today' | 'Yesterday' | 'Earlier'

/**
 * Which heading a notification sits under.
 *
 * Calendar days rather than elapsed hours: something from 11pm last night
 * belongs under "Yesterday" at 1am, not under "Today" because it was two
 * hours ago.
 */
export function getDayGroup(iso: string, now: Date = new Date()): DayGroup {
  const created = new Date(iso)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const createdTime = created.getTime()

  if (createdTime >= startOfToday) return 'Today'
  if (createdTime >= startOfToday - DAY) return 'Yesterday'
  return 'Earlier'
}

/** Group in feed order, dropping headings that have nothing under them. */
export function groupByDay<T extends { createdAt: string }>(
  items: T[],
  now: Date = new Date(),
): { group: DayGroup; items: T[] }[] {
  const order: DayGroup[] = ['Today', 'Yesterday', 'Earlier']
  const buckets = new Map<DayGroup, T[]>()

  items.forEach(item => {
    const group = getDayGroup(item.createdAt, now)
    const bucket = buckets.get(group)
    if (bucket) bucket.push(item)
    else buckets.set(group, [item])
  })

  return order
    .filter(group => buckets.has(group))
    .map(group => ({ group, items: buckets.get(group)! }))
}
