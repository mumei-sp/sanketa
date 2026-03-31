import { GraduationCap, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { text, primary, accent, withOpacity, baseColors } from '@/theme/colors'
import type { LucideIcon } from 'lucide-react'

interface StudentStatCardProps {
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
  cardBg: string
}

export function StudentStatCard({ label, value, icon: Icon, iconBg, iconColor, cardBg }: StudentStatCardProps) {
  return (
    <Card
      className="flex flex-row items-center justify-between px-4 py-3 gap-3 border-0 h-full"
      style={{ backgroundColor: cardBg }}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span style={{ fontSize: 12, color: text.muted }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: text.heading, lineHeight: 1.2 }}>
          {value.toLocaleString('en-US')}
        </span>
      </div>
      <div
        className="flex items-center justify-center size-10 min-w-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
    </Card>
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
      icon: GraduationCap,
      iconBg: withOpacity(baseColors.pink, 0.55),
      iconColor: primary.base,
      cardBg: withOpacity(baseColors.pink, 0.15),
    },
    {
      label: 'Grade 7 Students',
      value: grade7,
      icon: Users,
      iconBg: withOpacity(baseColors.blue, 0.6),
      iconColor: accent.base,
      cardBg: withOpacity(baseColors.blue, 0.18),
    },
    {
      label: 'Grade 8 Students',
      value: grade8,
      icon: Users,
      iconBg: withOpacity(baseColors.blue, 0.6),
      iconColor: accent.base,
      cardBg: withOpacity(baseColors.blue, 0.18),
    },
    {
      label: 'Grade 9 Students',
      value: grade9,
      icon: Users,
      iconBg: withOpacity(baseColors.blue, 0.6),
      iconColor: accent.base,
      cardBg: withOpacity(baseColors.blue, 0.18),
    },
  ] as StudentStatCardProps[]
}
