import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { text, withOpacity, baseColors } from '@/theme/colors'

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
      className="group/card relative flex flex-col justify-end px-4 py-3 border-0"
      style={{ backgroundColor: cardBg }}
    >
      {/* Action slot — top-left, visible on card hover */}
      {action && (
        <div className="absolute top-2 left-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
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
          color: inverted ? '#fff' : text.heading,
          lineHeight: 1.15,
        }}
      >
        {value.toLocaleString('en-IN')}
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
 * First card is always "Total Students"; remaining cards show one per selected grade.
 */
export function getStudentStats(
  students: { gradeLevel?: string }[],
  selectedGrades: string[],
) {
  const total = students.length
  const gradeCounts = getGradeCounts(students)

  const totalCard: StudentStatCardProps = {
    label: 'Total Students',
    value: total,
    iconContent: <Users className="w-3.5 h-3.5" style={{ color: baseColors.heading }} />,
    iconBg: withOpacity(baseColors.pink, 0.7),
    iconColor: baseColors.heading,
    cardBg: withOpacity(baseColors.blue, 0.35),
    inverted: false,
  }

  const gradeCards: StudentStatCardProps[] = selectedGrades.map(grade => ({
    label: `Grade ${grade} Students`,
    value: gradeCounts.get(grade) ?? 0,
    iconContent: grade,
    iconBg: withOpacity(baseColors.blue, 0.5),
    iconColor: baseColors.heading,
    cardBg: '#ffffff',
  }))

  return [totalCard, ...gradeCards]
}
