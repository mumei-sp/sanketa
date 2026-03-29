import { Calendar as CalendarIcon } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { text, border, background } from '@/theme/colors'
import { componentSpacing, spacing } from '@/config/spacing'

export default function Calendar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: componentSpacing.layout.sectionGap }}>
      <PageHeader
        title="Calendar"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Calendar' }]}
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
        <CalendarIcon
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
            margin: 0,
            marginBlockStart: spacing['1.5'],
          }}
        >
          View and manage school events, holidays, and schedules.
        </p>
      </div>
    </div>
  )
}
