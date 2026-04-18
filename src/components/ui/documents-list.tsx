import { MoreHorizontal, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border } from '@/theme/colors'

export interface DocumentItem {
  id: string
  name: string
  type: string
  size: string
}

export interface DocumentsListProps {
  documents: DocumentItem[]
  /** Section title. Default: 'Documents & Compliance' */
  title?: string
}

/**
 * DocumentsList - Generic document list inside a SectionCard.
 * Displays file names, types, and sizes with PDF-style icons.
 */
export function DocumentsList({ documents, title = 'Documents & Compliance' }: DocumentsListProps) {
  if (!documents.length) return null

  return (
    <SectionCard
      title={title}
      action={
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'], maxHeight: '220px', overflowY: 'auto' }}>
        {documents.map((doc, index) => (
          <div key={doc.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['3'],
                padding: `${spacing['2']} 0`,
                cursor: 'pointer',
              }}
              className="hover:opacity-80 transition-opacity"
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: spacing['2'],
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText className="w-4 h-4" style={{ color: 'var(--heading)' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  className="truncate"
                  style={{ fontSize: fontSizes.sm, fontWeight: 500, color: 'var(--heading)', margin: 0 }}
                >
                  {doc.name}
                </p>
                <p
                  style={{ fontSize: fontSizes.xs, color: text.body, margin: 0, marginTop: spacing['0.5'] }}
                >
                  {doc.type} · {doc.size}
                </p>
              </div>
            </div>
            {index < documents.length - 1 && (
              <div style={{ height: '1px', backgroundColor: border.subtle }} />
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
