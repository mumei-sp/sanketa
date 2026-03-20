import { DocumentsList } from '@/components/ui/documents-list'
import type { TeacherDocument } from '../types/teacher-detail'

interface TeacherDocumentsProps {
  documents: TeacherDocument[]
}

/**
 * TeacherDocuments - Thin wrapper around the shared DocumentsList component.
 */
export function TeacherDocuments({ documents }: TeacherDocumentsProps) {
  return <DocumentsList documents={documents} />
}
