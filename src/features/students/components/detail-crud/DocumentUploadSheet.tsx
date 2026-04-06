/**
 * DocumentUploadSheet — Side panel for adding a document record.
 *
 * Uses a Sheet (drawer) instead of Dialog for vertical space.
 * Form content wrapped in FormSection tile for consistent styling.
 * Integrates UploadDropzone for real drag-and-drop file selection.
 */

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormSection } from '@/components/form/FormSection'
import { UploadDropzone } from '@/components/inputs/UploadDropzone'
import type { DocumentItem } from '@/components/ui/documents-list'

/** Map common MIME prefixes to display types */
function inferType(file: File): string {
  if (file.type === 'application/pdf') return 'PDF'
  if (file.type.startsWith('image/')) return 'Image'
  return 'Other'
}

/** Human-readable file size */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface DocumentUploadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<DocumentItem, 'id'>) => void
  isSaving: boolean
}

export function DocumentUploadSheet({
  open,
  onOpenChange,
  onSave,
  isSaving,
}: DocumentUploadSheetProps) {
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState('PDF')
  const [file, setFile] = React.useState<File | null>(null)

  React.useEffect(() => {
    if (open) {
      setName('')
      setType('PDF')
      setFile(null)
    }
  }, [open])

  const handleFileAccepted = React.useCallback((accepted: File) => {
    setFile(accepted)
    // Auto-fill name and type from the file if fields are empty
    if (!name.trim()) setName(accepted.name)
    setType(inferType(accepted))
  }, [name])

  const handleFileRemove = React.useCallback(() => {
    setFile(null)
  }, [])

  const canSave = name.trim().length > 0

  const handleSubmit = React.useCallback(() => {
    if (!canSave) return
    onSave({
      name: name.trim(),
      type,
      size: file ? formatSize(file.size) : '—',
    })
  }, [canSave, name, type, file, onSave])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle>Upload Document</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <FormSection title="Document Details" width={12}>
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name <span className="text-destructive">*</span></Label>
              <Input
                id="doc-name"
                placeholder="e.g. ReportCard_Grade9.pdf"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Certificate">Certificate</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormSection title="File Upload" width={12}>
            <UploadDropzone
              onFileAccepted={handleFileAccepted}
              onFileRemove={handleFileRemove}
              file={file}
              showPreview={!!file}
              label="Click or drag to upload"
              description="PDF, JPG, PNG, DOCX — Max 10 MB"
              accept={{
                'application/pdf': ['.pdf'],
                'image/*': ['.jpg', '.jpeg', '.png'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              }}
              maxSize={10 * 1024 * 1024}
              height="h-48"
            />
          </FormSection>
        </div>

        <SheetFooter className="px-6 pb-6 pt-4 flex gap-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || isSaving}>
            {isSaving ? 'Uploading...' : 'Upload'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
