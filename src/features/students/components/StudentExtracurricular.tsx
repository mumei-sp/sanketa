import { Plus, Trash2, Waves, Accessibility, Bot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { CompactTable, type CompactTableColumn } from '@/components/ui/compact-table'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text } from '@/theme/colors'
import type { StudentActivity } from '../types'

interface StudentExtracurricularProps {
  activities: StudentActivity[]
  onAdd?: () => void
  onEdit?: (activity: StudentActivity) => void
  onDelete?: (id: string) => void
}

/** Map icon name strings to Lucide components */
const iconMap: Record<string, LucideIcon> = {
  Waves,
  Accessibility,
  Bot,
}

function getColumns(onDelete?: (id: string) => void): CompactTableColumn<StudentActivity>[] {
  const cols: CompactTableColumn<StudentActivity>[] = [
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
                  backgroundColor: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={'var(--heading)'} />
              </div>
            )}
            <div>
              <p style={{ fontSize: fontSizes.sm, fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
                {activity.club}
              </p>
              <p style={{ fontSize: fontSizes.xs, color: text.muted, margin: 0, marginTop: spacing['0.5'] }}>
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

  if (onDelete) {
    cols.push({
      key: '_actions',
      header: '',
      render: (activity) => (
        <button
          type="button"
          className="opacity-0 touch:opacity-100 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
          onClick={e => { e.stopPropagation(); onDelete(activity.id) }}
          aria-label={`Delete ${activity.club}`}
        >
          <Trash2 className="size-3.5 text-red-500" />
        </button>
      ),
    })
  }

  return cols
}

/**
 * StudentExtracurricular - Table of extracurricular activities.
 * Each club row shows an icon in a light blue circle, club name, and role.
 */
export function StudentExtracurricular({ activities, onAdd, onEdit, onDelete }: StudentExtracurricularProps) {
  const addButton = onAdd ? (
    <Button variant="ghost" size="icon" className="size-7" onClick={onAdd}>
      <Plus className="size-4" />
    </Button>
  ) : undefined

  const columns = getColumns(onDelete)

  return (
    <SectionCard title="Extracurricular" showDivider action={addButton}>
      {activities.length === 0 ? (
        <p className="text-center py-4" style={{ fontSize: fontSizes.xs, color: text.muted }}>
          No extracurricular activities yet
        </p>
      ) : (
        <CompactTable
          columns={columns}
          data={activities}
          rowKey={a => a.id}
          onRowClick={onEdit}
        />
      )}
    </SectionCard>
  )
}
