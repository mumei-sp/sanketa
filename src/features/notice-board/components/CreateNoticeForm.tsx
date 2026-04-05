import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, SelectField, DateField, TextareaField, SwitchField, GRID_COLS_2 } from '@/components/form/fields'
import { FormSection } from '@/components/form/FormSection'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { UploadDropzone } from '@/components/inputs/UploadDropzone'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NoticeFormSchema, type NoticeFormValues } from '../schemas/notice-schema'
import { NoticePreviewCard } from './NoticePreviewCard'

const CATEGORY_OPTIONS = [
  { value: 'Academic', label: 'Academic' },
  { value: 'Events', label: 'Events' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Arts', label: 'Arts' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Notice', label: 'Notice' },
  { value: 'Training', label: 'Training' },
  { value: 'Announcement', label: 'Announcement' },
]

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const DATE_LABEL_OPTIONS = [
  { value: 'Due Date', label: 'Due Date', range: false },
  { value: 'Deadline', label: 'Deadline', range: false },
  { value: 'Event Period', label: 'Event Period', range: true },
  { value: 'Registration Period', label: 'Registration Period', range: true },
  { value: 'RSVP By', label: 'RSVP By', range: false },
  { value: 'Last Date', label: 'Last Date', range: false },
]

const PRESET_IMAGES = [
  { label: 'Classroom', url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&h=200&fit=crop' },
  { label: 'Sports', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop' },
  { label: 'Science', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=200&fit=crop' },
  { label: 'Arts', url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=200&fit=crop' },
  { label: 'Finance', url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop' },
  { label: 'Nature', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=200&fit=crop' },
]

interface NoticeFormProps {
  onSubmit: (data: NoticeFormValues) => Promise<void>
  onCancel: () => void
  /** When provided, the form operates in edit mode */
  initialData?: NoticeFormValues & { id?: string }
}

export function CreateNoticeForm({ onSubmit, onCancel, initialData }: NoticeFormProps) {
  const isEditMode = !!initialData

  const { control, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<NoticeFormValues>({
    resolver: zodResolver(NoticeFormSchema),
    defaultValues: initialData ?? {
      title: '',
      content: '',
      category: CATEGORY_OPTIONS[0].value,
      audience: '',
      status: 'Active',
      postDate: new Date().toISOString(),
      dateLabel: DATE_LABEL_OPTIONS[0].value,
      dateValue: '',
      dateEndValue: '',
      thumbnail: PRESET_IMAGES[0].url,
      pinned: false,
    },
  })

  const formValues = watch()
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
  const [_uploadPreview, setUploadPreview] = React.useState<string | null>(null)

  const handlePresetSelect = React.useCallback((url: string) => {
    setUploadedFile(null)
    setUploadPreview(null)
    setValue('thumbnail', formValues.thumbnail === url ? '' : url)
  }, [setValue, formValues.thumbnail])

  const handleFileAccepted = React.useCallback((file: File) => {
    setUploadedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setUploadPreview(dataUrl)
      setValue('thumbnail', dataUrl)
    }
    reader.readAsDataURL(file)
  }, [setValue])

  const handleFileRemove = React.useCallback(() => {
    setUploadedFile(null)
    setUploadPreview(null)
    setValue('thumbnail', '')
  }, [setValue])

  return (
    <div className="flex flex-col h-full">
      {/* Header with close button */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold">{isEditMode ? 'Edit Notice' : 'Create Notice'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Form in a single card */}
        <div className="flex-1 overflow-y-auto p-6 pt-0 bg-page">
          <form id="create-notice-form" onSubmit={handleSubmit(onSubmit)}>
            <FormSection
              title="Notice Information"
              description={isEditMode ? 'Update the notice details' : 'Fill in the details for the new notice'}
              width={12}
            >
              <TextField
                name="title"
                control={control}
                label="Title"
                placeholder="Enter notice title"
                required
                disabled={isEditMode}
              />
              <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
                <SelectField
                  name="status"
                  control={control}
                  label="Status"
                  options={STATUS_OPTIONS}
                  placeholder="Select status"
                  required
                />
                <SelectField
                  name="category"
                  control={control}
                  label="Category"
                  options={CATEGORY_OPTIONS}
                  placeholder="Select category"
                  required
                />
              </div>
              {DATE_LABEL_OPTIONS.find(o => o.value === formValues.dateLabel)?.range ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <SelectField
                    name="dateLabel"
                    control={control}
                    label="Date Type"
                    options={DATE_LABEL_OPTIONS}
                    placeholder="Select date type"
                    required
                  />
                  <DateField
                    name="dateValue"
                    control={control}
                    label="Start Date"
                    required
                  />
                  <DateField
                    name="dateEndValue"
                    control={control}
                    label="End Date"
                    required
                  />
                </div>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
                  <SelectField
                    name="dateLabel"
                    control={control}
                    label="Date Type"
                    options={DATE_LABEL_OPTIONS}
                    placeholder="Select date type"
                    required
                  />
                  <DateField
                    name="dateValue"
                    control={control}
                    label={formValues.dateLabel || 'Date'}
                    required
                  />
                </div>
              )}
              <TextField
                name="audience"
                control={control}
                label="Target Audience"
                placeholder="e.g., Students (Grade 7-9)"
                required
              />
              <TextareaField
                name="content"
                control={control}
                label="Details"
                placeholder="Enter the details of the notice..."
                rows={6}
                description="Up to 5,000 characters"
                textareaClassName="field-sizing-fixed min-h-[160px]"
                required
              />

              {/* Image Upload */}
              <div className="space-y-3">
                <Label>Notice Image<span className="text-destructive ml-0.5">*</span></Label>

                {/* Preset images */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Choose a preset image</p>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_IMAGES.map(preset => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => handlePresetSelect(preset.url)}
                        className={cn(
                          'relative rounded-lg overflow-hidden border-2 transition-all aspect-[2/1]',
                          formValues.thumbnail === preset.url
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-transparent hover:border-muted-foreground/30',
                        )}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                        {formValues.thumbnail === preset.url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary rounded-full p-0.5">
                              <Check className="size-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or upload custom */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Or upload your own</p>
                  <UploadDropzone
                    label="Click or drag to upload"
                    description="Max: 2MB, JPG/PNG"
                    accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
                    maxSize={2 * 1024 * 1024}
                    height="h-24"
                    showPreview
                    file={uploadedFile}
                    onFileAccepted={handleFileAccepted}
                    onFileRemove={handleFileRemove}
                  />
                </div>

                {errors.thumbnail && (
                  <p role="alert" className="text-destructive text-sm">{errors.thumbnail.message}</p>
                )}
              </div>

              {/* Pin toggle */}
              <SwitchField
                name="pinned"
                control={control}
                label="Pin this notice"
                description="Pinned notices appear at the top of the notice board"
              />
            </FormSection>
          </form>
        </div>

        {/* Right: Live Preview — desktop only */}
        <div className="hidden lg:block w-[380px] flex-shrink-0 bg-muted/30 overflow-y-auto p-6 pt-0">
          <h3 className="text-section-title mb-4">Live Preview</h3>
          <NoticePreviewCard values={formValues} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-background">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" form="create-notice-form" disabled={isSubmitting}>
          {isSubmitting
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Notice' : 'Create Notice')}
        </Button>
      </div>
    </div>
  )
}
