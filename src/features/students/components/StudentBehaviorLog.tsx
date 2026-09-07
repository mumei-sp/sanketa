import { Plus, Trash2 } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { Button } from '@/components/ui/button'
import { CompactTable, type CompactTableColumn } from '@/components/ui/compact-table'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border } from '@/theme/colors'
import type { StudentBehaviorEntry } from '../types'

interface StudentBehaviorLogProps {
  entries: StudentBehaviorEntry[]
  onAdd?: () => void
  onEdit?: (entry: StudentBehaviorEntry) => void
  onDelete?: (id: string) => void
}

function getColumns(onDelete?: (id: string) => void): CompactTableColumn<StudentBehaviorEntry>[] {
  const cols: CompactTableColumn<StudentBehaviorEntry>[] = [
    { key: 'date', header: 'Date', cellNowrap: true },
    {
      key: 'type',
      header: 'Type & Details',
      render: (entry) => (
        <div>
          <p style={{ fontSize: fontSizes.sm, fontWeight: 700, color: text.body, margin: 0 }}>
            {entry.type}
          </p>
          <p style={{ fontSize: fontSizes.xs, color: text.muted, margin: 0, marginTop: spacing['0.5'] }}>
            {entry.details}
          </p>
        </div>
      ),
    },
    { key: 'reportedBy', header: 'Reported By', cellNowrap: true },
    {
      key: 'statusAction',
      header: 'Status/Action',
      render: (entry) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: fontSizes.xs,
            fontWeight: 500,
            color: text.body,
            backgroundColor: 'transparent',
            border: `1px solid ${border.default}`,
            padding: `${spacing['1']} ${spacing['2']}`,
            borderRadius: spacing['1.5'],
            whiteSpace: 'nowrap',
          }}
        >
          {entry.statusAction}
        </span>
      ),
    },
  ]

  if (onDelete) {
    cols.push({
      key: '_actions',
      header: '',
      render: (entry) => (
        <button
          type="button"
          className="opacity-0 touch:opacity-100 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
          onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
          aria-label={`Delete behavior entry`}
        >
          <Trash2 className="size-3.5 text-red-500" />
        </button>
      ),
    })
  }

  return cols
}

/**
 * StudentBehaviorLog - Table of behavior & discipline entries.
 * Type shown as bold black text, status as gray bordered pills.
 */
export function StudentBehaviorLog({ entries, onAdd, onEdit, onDelete }: StudentBehaviorLogProps) {
  const addButton = onAdd ? (
    <Button variant="ghost" size="icon" className="size-7" onClick={onAdd}>
      <Plus className="size-4" />
    </Button>
  ) : undefined

  const columns = getColumns(onDelete)

  return (
    <SectionCard title="Behavior & Discipline Log" showDivider action={addButton}>
      {entries.length === 0 ? (
        <p className="text-center py-4" style={{ fontSize: fontSizes.xs, color: text.muted }}>
          No behavior entries yet
        </p>
      ) : (
        <CompactTable
          columns={columns}
          data={entries}
          rowKey={e => e.id}
          onRowClick={onEdit}
        />
      )}
    </SectionCard>
  )
}
