import { DocumentsList } from '@/components/ui/documents-list'
import type { DocumentItem } from '@/components/ui/documents-list'

interface StudentDocumentsProps {
  documents: DocumentItem[]
}

/**
 * StudentDocuments - Thin wrapper around the shared DocumentsList component.
 */
export function StudentDocuments({ documents }: StudentDocumentsProps) {
  return <DocumentsList documents={documents} title="Documents" />
}
