import { MoreHorizontal } from 'lucide-react'
import { text, border, withOpacity } from '@/theme/colors'
import * as React from 'react'
import { fetchSpecialPrograms } from '@/api/services/student-service'
import type { SpecialProgramEntry } from '@/features/students/types'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Enrichment': { bg: withOpacity('var(--accent)', 0.3), color: 'var(--accent)' },
  'Academic Support': { bg: withOpacity('#C7E5C8', 0.5), color: '#3A7D44' },
  'Finance': { bg: withOpacity('var(--primary)', 0.3), color: '#8B2B6E' },
}

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? { bg: withOpacity('var(--accent)', 0.2), color: text.muted }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function SpecialPrograms() {
  const [specialProgramsData, setSpecialProgramsData] = React.useState<SpecialProgramEntry[]>([])

  React.useEffect(() => {
    fetchSpecialPrograms()
      .then(setSpecialProgramsData)
      .catch(error => console.error('Failed to load special programs', error))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
          Special Programs
        </span>
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', color: text.muted,
          }}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {specialProgramsData.map((entry, i) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingBottom: i < specialProgramsData.length - 1 ? 12 : 0,
              borderBottom: i < specialProgramsData.length - 1 ? `1px solid ${border.subtle}` : 'none',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 34,
                height: 34,
                minWidth: 34,
                borderRadius: '50%',
                backgroundColor: entry.avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--heading)',
                flexShrink: 0,
              }}
            >
              {getInitials(entry.name)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--heading)', whiteSpace: 'nowrap' }}>
                  {entry.name}
                </span>
                <span style={{ fontSize: 11, color: text.muted }}>
                  {entry.studentId} · {entry.classLabel}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                {entry.categories.map(cat => {
                  const style = getCategoryStyle(cat)
                  return (
                    <span
                      key={cat}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        backgroundColor: style.bg,
                        color: style.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat}
                    </span>
                  )
                })}
                <span style={{ fontSize: 11, color: text.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.program}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
