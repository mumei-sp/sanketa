import { ClipboardList } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { text, border, background } from '@/theme/colors'
import { componentSpacing, spacing } from '@/config/spacing'

export function AssignmentsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: componentSpacing.layout.sectionGap }}>
      <PageHeader
        title="Assignments"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Assignments' }]}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${spacing['20']} ${spacing['4']}`,
          backgroundColor: background.card,
          borderRadius: '0.75rem',
          border: `1px solid ${border.default}`,
        }}
      >
        <ClipboardList
          size={48}
          style={{ color: text.muted, opacity: 0.35, marginBottom: spacing['4'] }}
        />
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: text.heading,
            margin: 0,
          }}
        >
          Coming Soon
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: text.muted,
            opacity: 0.6,
            marginTop: spacing['1.5'],
            margin: 0,
            marginBlockStart: spacing['1.5'],
          }}
        >
          Manage and track student assignments from here.
        </p>
      </div>
    </div>
  )
}
