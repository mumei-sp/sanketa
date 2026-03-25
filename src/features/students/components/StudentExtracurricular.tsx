import { MoreHorizontal, Waves, Accessibility, Bot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { CompactTable, type CompactTableColumn } from '@/components/ui/compact-table'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, accent } from '@/theme/colors'
import type { StudentActivity } from '../types'

interface StudentExtracurricularProps {
  activities: StudentActivity[]
}

/** Map icon name strings to Lucide components */
const iconMap: Record<string, LucideIcon> = {
  Waves,
  Accessibility,
  Bot,
}

const columns: CompactTableColumn<StudentActivity>[] = [
  {
    key: 'club',
    header: 'Club',
    render: (activity) => {
      const Icon = iconMap[activity.icon]
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
          {Icon && (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: accent.base,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={16} color={text.heading} />
            </div>
          )}
          <div>
            <p
              style={{
                fontSize: fontSizes.sm,
                fontWeight: 600,
                color: text.heading,
                margin: 0,
              }}
            >
              {activity.club}
            </p>
            <p
              style={{
                fontSize: fontSizes.xs,
                color: text.muted,
                margin: 0,
                marginTop: spacing['0.5'],
              }}
            >
              {activity.role}
            </p>
          </div>
        </div>
      )
    },
  },
  { key: 'achievements', header: 'Achievements' },
  { key: 'duration', header: 'Duration', cellNowrap: true },
  { key: 'advisor', header: 'Advisor', cellNowrap: true },
]

/**
 * StudentExtracurricular - Table of extracurricular activities.
 * Each club row shows an icon in a light blue circle, club name, and role.
 */
export function StudentExtracurricular({ activities }: StudentExtracurricularProps) {
  if (!activities.length) return null

  return (
    <SectionCard
      title="Extracurricular"
      showDivider
      action={
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </Button>
      }
    >
      <CompactTable
        columns={columns}
        data={activities}
        rowKey={a => a.id}
      />
    </SectionCard>
  )
}
