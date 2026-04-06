import { Globe, Award, BookOpen, GraduationCap, Heart, Star, Trophy, Music, Palette, Code, Plus, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionCard } from '@/components/ui/section-card'
import { Button } from '@/components/ui/button'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, accent, border } from '@/theme/colors'
import type { StudentScholarship } from '../types'

interface StudentScholarshipsProps {
  scholarships: StudentScholarship[]
  onAdd?: () => void
  onEdit?: (scholarship: StudentScholarship) => void
  onDelete?: (id: string) => void
}

const iconMap: Record<string, LucideIcon> = {
  globe: Globe,
  award: Award,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  heart: Heart,
  star: Star,
  trophy: Trophy,
  music: Music,
  palette: Palette,
  code: Code,
}

/**
 * StudentScholarships - Displays scholarship awards in a SectionCard.
 */
export function StudentScholarships({ scholarships, onAdd, onEdit, onDelete }: StudentScholarshipsProps) {
  const addButton = onAdd ? (
    <Button variant="ghost" size="icon" className="size-7" onClick={onAdd}>
      <Plus className="size-4" />
    </Button>
  ) : undefined

  return (
    <SectionCard title="Scholarships" action={addButton}>
      {scholarships.length === 0 ? (
        <p
          className="text-center py-4"
          style={{ fontSize: fontSizes.xs, color: text.muted }}
        >
          No scholarships yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
          {scholarships.map((scholarship, index) => {
            const Icon = iconMap[scholarship.icon]
            return (
              <div key={scholarship.id}>
                <div
                  className="group cursor-pointer rounded-md -mx-1 px-1"
                  style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}
                  onClick={() => onEdit?.(scholarship)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') onEdit?.(scholarship) }}
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
                    <p style={{ fontSize: fontSizes.sm, fontWeight: 600, color: text.heading, margin: 0 }}>
                      {scholarship.title}
                    </p>
                    <p style={{ fontSize: fontSizes.xs, color: text.body, margin: 0, marginTop: spacing['0.5'] }}>
                      {scholarship.category}
                    </p>
                  </div>
                  {onDelete && (
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-red-50"
                      onClick={e => { e.stopPropagation(); onDelete(scholarship.id) }}
                      aria-label={`Delete ${scholarship.title}`}
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </button>
                  )}
                </div>
                {index < scholarships.length - 1 && (
                  <div style={{ height: '1px', backgroundColor: border.subtle, marginTop: spacing['3'] }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
