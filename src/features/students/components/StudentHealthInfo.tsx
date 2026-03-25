import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, background } from '@/theme/colors'
import type { StudentHealthRecord } from '../types'

interface StudentHealthInfoProps {
  records: StudentHealthRecord[]
}

/**
 * StudentHealthInfo - Displays health & medical records in a SectionCard.
 * Each record sits in a light gray tinted card with title in heading color
 * and description in body color.
 */
export function StudentHealthInfo({ records }: StudentHealthInfoProps) {
  if (!records.length) return null

  return (
    <SectionCard title="Health & Medical Info" showDivider>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
        {records.map(record => (
          <div
            key={record.id}
            style={{
              backgroundColor: background.page,
              borderRadius: spacing['2'],
              padding: spacing['3'],
            }}
          >
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
        ))}
      </div>
    </SectionCard>
  )
}
