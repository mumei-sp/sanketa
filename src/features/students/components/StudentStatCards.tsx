import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { text, withOpacity, baseColors, accent } from '@/theme/colors'

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
}

export function StudentStatCard({
  label,
  value,
  iconContent,
  iconBg,
  iconColor,
  cardBg,
  inverted,
}: StudentStatCardProps) {
  return (
    <Card
      className="relative flex flex-col justify-end px-4 py-3 border-0 h-full min-h-[90px]"
      style={{ backgroundColor: cardBg }}
    >
      {/* Icon — top-right corner */}
      <div
        className="absolute top-3 right-3 flex items-center justify-center size-9 rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        {typeof iconContent === 'string' ? (
          <span
            style={{
              fontSize: 13,
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

      {/* Number + Label — bottom-left */}
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: inverted ? '#fff' : text.heading,
          lineHeight: 1.15,
        }}
      >
        {value.toLocaleString('en-US')}
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
}

/** 2×2 on mobile/desktop, 1×4 on tablet */
export function StudentStatGroup({ stats }: StudentStatGroupProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3 h-full">
      {stats.map((stat, i) => (
        <StudentStatCard key={i} {...stat} />
      ))}
    </div>
  )
}

/** Returns stat definitions computed from the students list */
export function getStudentStats(students: { gradeLevel: string }[]) {
  const total = students.length
  const grade7 = students.filter(s => s.gradeLevel === '7').length
  const grade8 = students.filter(s => s.gradeLevel === '8').length
  const grade9 = students.filter(s => s.gradeLevel === '9').length

  return [
    {
      label: 'Total Students',
      value: total,
      iconContent: <Users className="w-4 h-4" style={{ color: baseColors.heading }} />,
      iconBg: withOpacity(baseColors.pink, 0.7),
      iconColor: baseColors.heading,
      cardBg: withOpacity(baseColors.blue, 0.35),
      inverted: false,
    },
    {
      label: 'Grade 7 Students',
      value: grade7,
      iconContent: '7',
      iconBg: withOpacity(baseColors.blue, 0.5),
      iconColor: baseColors.heading,
      cardBg: '#ffffff',
    },
    {
      label: 'Grade 8 Students',
      value: grade8,
      iconContent: '8',
      iconBg: withOpacity(baseColors.blue, 0.5),
      iconColor: baseColors.heading,
      cardBg: '#ffffff',
    },
    {
      label: 'Grade 9 Students',
      value: grade9,
      iconContent: '9',
      iconBg: withOpacity(baseColors.blue, 0.5),
      iconColor: baseColors.heading,
      cardBg: '#ffffff',
    },
  ] as StudentStatCardProps[]
}
