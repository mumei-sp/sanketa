import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CountUp } from '@/components/shared/CountUp'
import { text, withOpacity } from '@/theme/colors'

interface StudentStatCardProps {
  label: string
  value: number
  /** Render content inside the icon circle (ReactNode: icon or text) */
  iconContent: React.ReactNode
  iconBg: string
  iconColor: string
  /** Card background color */
  cardBg: string
  /** If true, card text renders white (for dark bg cards like Total Students) */
  inverted?: boolean
  /** Optional action element (e.g. settings button), rendered top-left */
  action?: React.ReactNode
}

export function StudentStatCard({
  label,
  value,
  iconContent,
  iconBg,
  iconColor,
  cardBg,
  inverted,
  action,
}: StudentStatCardProps) {
  return (
    <Card
      className="card-hover group/card relative flex flex-col justify-end px-4 py-3 border-0"
      style={{ backgroundColor: cardBg }}
    >
      {/* Action slot — top-left, visible on card hover */}
      {action && (
        <div className="absolute top-2 left-2 opacity-0 touch:opacity-100 group-hover/card:opacity-100 transition-opacity duration-200">
          {action}
        </div>
      )}

      {/* Icon — top-right corner: outer bg circle + inner ring + content */}
      <div
        className="absolute top-3 right-3 flex items-center justify-center size-9 rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        <div
          className="flex items-center justify-center size-6 rounded-full"
          style={{ border: `1.5px solid ${iconColor}` }}
        >
          {typeof iconContent === 'string' ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: iconColor,
                lineHeight: 1,
              }}
            >
              {iconContent}
            </span>
          ) : (
            iconContent
          )}
        </div>
      </div>

      {/* Number + Label — bottom-left */}
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: inverted ? '#fff' : 'var(--heading)',
          lineHeight: 1.15,
        }}
      >
        <CountUp value={value} />
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: inverted ? 'rgba(255,255,255,0.8)' : text.muted,
          marginTop: 2,
        }}
      >
        {label}
      </span>
    </Card>
  )
}

interface StudentStatGroupProps {
  stats: StudentStatCardProps[]
  /** Optional action element rendered in the top-left of the first card (e.g. ClassPicker trigger) */
  action?: React.ReactNode
}

/** 2×2 on mobile/desktop, 1×4 on tablet */
export function StudentStatGroup({ stats, action }: StudentStatGroupProps) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 md:grid-cols-4 md:grid-rows-1 lg:grid-cols-2 lg:grid-rows-2 gap-4 h-full">
      {stats.map((stat, i) => (
        <StudentStatCard key={i} {...stat} action={i === 0 ? action : undefined} />
      ))}
    </div>
  )
}

/**
 * Computes grade counts from a list of students.
 * Returns a Map of grade → student count, useful for ClassPicker defaults.
 */
export function getGradeCounts(students: { gradeLevel?: string }[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const s of students) {
    if (s.gradeLevel) {
      counts.set(s.gradeLevel, (counts.get(s.gradeLevel) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * Returns stat card definitions for the given selected grades.
 *
 * First card is always "Total Students". The rest is resolved per-grade
 * against the picker's drill-down state:
 *
 *   - Compare mode ON for this grade      → one card per section of the
 *                                            grade (e.g. Class 9A, Class 9B).
 *   - Partial section pick for this grade → one card per PICKED section
 *                                            only (e.g. only Class 9A).
 *   - Otherwise (all sections ticked)     → single "Grade N Students" card.
 *
 * So deselecting 9B in the popover narrows the stat group to just Class 9A,
 * and re-ticking it collapses back to the grade aggregate.
 */
export function getStudentStats(
  students: { gradeLevel?: string; class?: string }[],
  selectedGrades: string[],
  options?: {
    /** Grades the user flipped into compare-sections mode. Defaults to none. */
    compareGrades?: string[]
    /**
     * Section labels the user currently has ticked in their popovers. When a
     * grade's set is a strict subset of its admin-configured sections, the
     * stat tiles narrow to only those picked sections instead of showing the
     * grade aggregate. Omit and "all sections on" is assumed.
     */
    pickedSections?: string[]
    /**
     * All class sections from admin config, so we know which sections to
     * emit cards for even when no students currently belong to them.
     * Shape: `[{ grade: '9', label: '9A' }, ...]`. Omit and we'll derive
     * from the student roster only.
     */
    allSections?: { grade: string; label: string }[]
  },
) {
  const total = students.length
  const gradeCounts = getGradeCounts(students)

  // Per-class counts (keyed by the full class label, e.g. "9A").
  const classCounts = new Map<string, number>()
  students.forEach(s => {
    if (s.class) classCounts.set(s.class, (classCounts.get(s.class) ?? 0) + 1)
  })

  const compareSet = new Set(options?.compareGrades ?? [])
  const pickedSectionsSet = new Set(options?.pickedSections ?? [])
  const hasPickedSections = pickedSectionsSet.size > 0
  const sectionsByGrade = new Map<string, string[]>()
  ;(options?.allSections ?? []).forEach(s => {
    const list = sectionsByGrade.get(s.grade) ?? []
    list.push(s.label)
    sectionsByGrade.set(s.grade, list)
  })
  // Fallback: if allSections wasn't supplied, derive from the roster.
  if (sectionsByGrade.size === 0) {
    students.forEach(s => {
      if (!s.gradeLevel || !s.class) return
      const list = sectionsByGrade.get(s.gradeLevel) ?? []
      if (!list.includes(s.class)) list.push(s.class)
      sectionsByGrade.set(s.gradeLevel, list)
    })
  }

  const totalCard: StudentStatCardProps = {
    label: 'Total Students',
    value: total,
    iconContent: <Users className="w-3.5 h-3.5" style={{ color: 'var(--primary-foreground)' }} />,
    iconBg: withOpacity('var(--primary)', 0.7),
    iconColor: 'var(--primary-foreground)',
    cardBg: withOpacity('var(--accent)', 0.35),
    inverted: false,
  }

  const restCards: StudentStatCardProps[] = []

  // Render one section card, used whether we're in compare-mode or in a
  // partial-pick drill-down. Kept local so both branches stay consistent.
  const pushSectionCard = (label: string) => {
    restCards.push({
      label: `Class ${label} Students`,
      value: classCounts.get(label) ?? 0,
      // Show the section letter in the icon circle (e.g. "A") so it's
      // visually distinct from the grade number used elsewhere.
      iconContent: label.replace(/^\d+/, '') || label,
      iconBg: withOpacity('var(--primary)', 0.4),
      iconColor: 'var(--primary-foreground)',
      cardBg: 'var(--card)',
    })
  }

  selectedGrades.forEach(grade => {
    const gradeSections = sectionsByGrade.get(grade) ?? []
    if (gradeSections.length === 0) {
      // No section data — fall back to the grade aggregate card.
      restCards.push({
        label: `Grade ${grade} Students`,
        value: gradeCounts.get(grade) ?? 0,
        iconContent: grade,
        iconBg: withOpacity('var(--accent)', 0.5),
        iconColor: 'var(--accent-foreground)',
        cardBg: 'var(--card)',
      })
      return
    }

    // How many of this grade's sections are currently ticked? When the caller
    // didn't supply pickedSections we assume "all ticked" (backwards-compat
    // with older consumers).
    const activeSections = hasPickedSections
      ? gradeSections.filter(l => pickedSectionsSet.has(l))
      : gradeSections
    const allSectionsOn = activeSections.length === gradeSections.length

    const inCompareMode = compareSet.has(grade) && gradeSections.length > 1
    const partiallyPicked = !allSectionsOn && activeSections.length > 0

    if (inCompareMode || partiallyPicked) {
      // Drill-down: one card per currently-active section. Falls back to
      // all grade sections when compare mode is on with an empty pick set
      // (shouldn't happen in practice, but keeps the card group non-empty).
      const cards = activeSections.length > 0 ? activeSections : gradeSections
      cards.forEach(pushSectionCard)
    } else {
      // Default: grade aggregate.
      restCards.push({
        label: `Grade ${grade} Students`,
        value: gradeCounts.get(grade) ?? 0,
        iconContent: grade,
        iconBg: withOpacity('var(--accent)', 0.5),
        iconColor: 'var(--accent-foreground)',
        cardBg: 'var(--card)',
      })
    }
  })

  // Hard cap the total at 4 (1 Total + 3 customisable) — the tile grid
  // is laid out for exactly this shape (2×2 mobile, 1×4 tablet, 2×2
  // desktop). The picker already enforces an effective-series max of 3
  // via its compareGrades-aware isMaxed check, so this cap is defensive:
  // it stops any caller that forgets to pass the picker's max value from
  // breaking the layout.
  return [totalCard, ...restCards.slice(0, 3)]
}
