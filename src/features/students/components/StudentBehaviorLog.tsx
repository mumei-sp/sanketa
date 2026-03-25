import { SectionCard } from '@/components/ui/section-card'
import { CompactTable, type CompactTableColumn } from '@/components/ui/compact-table'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border } from '@/theme/colors'
import type { StudentBehaviorEntry } from '../types'

interface StudentBehaviorLogProps {
  entries: StudentBehaviorEntry[]
}

const columns: CompactTableColumn<StudentBehaviorEntry>[] = [
  { key: 'date', header: 'Date', cellNowrap: true },
  {
    key: 'type',
    header: 'Type & Details',
    render: (entry) => (
      <div>
        <p
          style={{
            fontSize: fontSizes.sm,
            fontWeight: 700,
            color: text.body,
            margin: 0,
          }}
        >
          {entry.type}
        </p>
        <p
          style={{
            fontSize: fontSizes.xs,
            color: text.muted,
            margin: 0,
            marginTop: spacing['0.5'],
          }}
        >
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

/**
 * StudentBehaviorLog - Table of behavior & discipline entries.
 * Type shown as bold black text, status as gray bordered pills.
 */
export function StudentBehaviorLog({ entries }: StudentBehaviorLogProps) {
  if (!entries.length) return null

  return (
    <SectionCard title="Behavior & Discipline Log" showDivider>
      <CompactTable
        columns={columns}
        data={entries}
        rowKey={e => e.id}
      />
    </SectionCard>
  )
}
