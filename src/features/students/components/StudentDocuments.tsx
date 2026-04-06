import { Plus, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border, primary } from '@/theme/colors'
import type { DocumentItem } from '@/components/ui/documents-list'

interface StudentDocumentsProps {
  documents: DocumentItem[]
  onAdd?: () => void
  onDelete?: (id: string) => void
}

/**
 * StudentDocuments - Documents list with add/delete support.
 */
export function StudentDocuments({ documents, onAdd, onDelete }: StudentDocumentsProps) {
  const addButton = onAdd ? (
    <Button variant="ghost" size="icon" className="size-7" onClick={onAdd}>
      <Plus className="size-4" />
    </Button>
  ) : undefined

  return (
    <SectionCard title="Documents" action={addButton}>
      {documents.length === 0 ? (
        <p className="text-center py-4" style={{ fontSize: fontSizes.xs, color: text.muted }}>
          No documents yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'], maxHeight: '220px', overflowY: 'auto' }}>
          {documents.map((doc, index) => (
            <div key={doc.id}>
              <div
                className="group"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing['3'],
                  padding: `${spacing['2']} 0`,
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: spacing['2'],
                    backgroundColor: primary.base,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText className="w-4 h-4" style={{ color: text.heading }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    className="truncate"
                    style={{ fontSize: fontSizes.sm, fontWeight: 500, color: text.heading, margin: 0 }}
                  >
                    {doc.name}
                  </p>
                  <p style={{ fontSize: fontSizes.xs, color: text.body, margin: 0, marginTop: spacing['0.5'] }}>
                    {doc.type} · {doc.size}
                  </p>
                </div>
                {onDelete && (
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-red-50"
                    onClick={() => onDelete(doc.id)}
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                  </button>
                )}
              </div>
              {index < documents.length - 1 && (
                <div style={{ height: '1px', backgroundColor: border.subtle }} />
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
