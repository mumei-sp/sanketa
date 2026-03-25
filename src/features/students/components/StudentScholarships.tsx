import { Globe, Award } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, accent, border } from '@/theme/colors'
import type { StudentScholarship } from '../types'

interface StudentScholarshipsProps {
  scholarships: StudentScholarship[]
}

const iconMap = {
  globe: Globe,
  award: Award,
}

/**
 * StudentScholarships - Displays scholarship awards in a SectionCard.
 */
export function StudentScholarships({ scholarships }: StudentScholarshipsProps) {
  if (!scholarships.length) return null

  return (
    <SectionCard title="Scholarships">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
        {scholarships.map((scholarship, index) => {
          const Icon = iconMap[scholarship.icon]
          return (
            <div key={scholarship.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing['3'],
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: spacing['2'],
                    backgroundColor: accent.base,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: text.heading }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: fontSizes.sm,
                      fontWeight: 600,
                      color: text.heading,
                      margin: 0,
                    }}
                  >
                    {scholarship.title}
                  </p>
                  <p
                    style={{
                      fontSize: fontSizes.xs,
                      color: text.body,
                      margin: 0,
                      marginTop: spacing['0.5'],
                    }}
                  >
                    {scholarship.category}
                  </p>
                </div>
              </div>
              {index < scholarships.length - 1 && (
                <div
                  style={{
                    height: '1px',
                    backgroundColor: border.subtle,
                    marginTop: spacing['3'],
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
