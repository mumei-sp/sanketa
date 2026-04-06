import { Plus, Trash2 } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { Button } from '@/components/ui/button'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, background } from '@/theme/colors'
import type { StudentHealthRecord } from '../types'

interface StudentHealthInfoProps {
  records: StudentHealthRecord[]
  onAdd?: () => void
  onEdit?: (record: StudentHealthRecord) => void
  onDelete?: (id: string) => void
}

/**
 * StudentHealthInfo - Displays health & medical records in a SectionCard.
 * Each record sits in a light gray tinted card with title in heading color
 * and description in body color.
 */
export function StudentHealthInfo({ records, onAdd, onEdit, onDelete }: StudentHealthInfoProps) {
  const addButton = onAdd ? (
    <Button variant="ghost" size="icon" className="size-7" onClick={onAdd}>
      <Plus className="size-4" />
    </Button>
  ) : undefined

  return (
    <SectionCard title="Health & Medical Info" showDivider action={addButton}>
      {records.length === 0 ? (
        <p
          className="text-center py-4"
          style={{ fontSize: fontSizes.xs, color: text.muted }}
        >
          No health records yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
          {records.map(record => (
            <div
              key={record.id}
              className="group cursor-pointer"
              style={{
                backgroundColor: background.page,
                borderRadius: spacing['2'],
                padding: spacing['3'],
                position: 'relative',
              }}
              onClick={() => onEdit?.(record)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') onEdit?.(record) }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontSize: fontSizes.sm,
                      fontWeight: 600,
                      color: text.heading,
                      margin: 0,
                    }}
                  >
                    {record.title}
                  </p>
                  <p
                    style={{
                      fontSize: fontSizes.xs,
                      color: text.body,
                      margin: 0,
                      marginTop: spacing['1'],
                      lineHeight: 1.5,
                    }}
                  >
                    {record.description}
                  </p>
                </div>
                {onDelete && (
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-red-50"
                    onClick={e => { e.stopPropagation(); onDelete(record.id) }}
                    aria-label={`Delete ${record.title}`}
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
