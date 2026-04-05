import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, SelectField, DateField, TextareaField, SwitchField, GRID_COLS_2 } from '@/components/form/fields'
import { FormSection } from '@/components/form/FormSection'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EventFormSchema,
  type EventFormValues,
  EVENT_CATEGORIES,
  PRIORITY_OPTIONS,
  REMINDER_OPTIONS,
} from '../schemas/event-schema'

interface EventFormProps {
  onSubmit: (data: EventFormValues) => Promise<void>
  onCancel: () => void
  initialData?: EventFormValues & { id?: string }
  defaultDate?: string
}

export function EventForm({ onSubmit, onCancel, initialData, defaultDate }: EventFormProps) {
  const isEditMode = !!initialData

  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(EventFormSchema) as any,
    defaultValues: initialData ?? {
      title: '',
      description: '',
      date: defaultDate || '',
      isAllDay: false,
      startTime: '',
      endTime: '',
      category: EVENT_CATEGORIES[0].value,
      location: '',
      link: '',
      attendees: '',
      priority: 'medium',
      reminder: 'none',
      notes: '',
    },
  })

  const isAllDay = watch('isAllDay')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold">{isEditMode ? 'Edit Event' : 'Create Event'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 pt-0 bg-page">
        <form id="event-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Info */}
          <FormSection
            title="Basic Information"
            description={isEditMode ? 'Update the event details' : 'Fill in the event details'}
            width={12}
          >
            <TextField
              name="title"
              control={control}
              label="Title"
              placeholder="Enter event title"
              required
            />
            <TextareaField
              name="description"
              control={control}
              label="Description"
              placeholder="Enter a description of the event..."
              rows={3}
              textareaClassName="field-sizing-fixed min-h-[80px]"
            />
            <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
              <SelectField
                name="category"
                control={control}
                label="Category"
                options={[...EVENT_CATEGORIES]}
                placeholder="Select category"
                required
              />
              <SelectField
                name="priority"
                control={control}
                label="Priority"
                options={[...PRIORITY_OPTIONS]}
                placeholder="Select priority"
              />
            </div>
          </FormSection>

          {/* Schedule */}
          <FormSection
            title="Schedule"
            description="Set the date and time for this event"
            width={12}
          >
            <SwitchField
              name="isAllDay"
              control={control}
              label="All-day event"
              description="Toggle for events without specific start/end times"
            />
            <div className="grid gap-4" style={{ gridTemplateColumns: isAllDay ? '1fr' : '1fr 1fr 1fr' }}>
              <DateField
                name="date"
                control={control}
                label="Date"
                required
              />
              {!isAllDay && (
                <>
                  <TimeField name="startTime" control={control} label="Start Time" required />
                  <TimeField name="endTime" control={control} label="End Time" />
                </>
              )}
            </div>
            <SelectField
              name="reminder"
              control={control}
              label="Reminder"
              options={[...REMINDER_OPTIONS]}
              placeholder="Select reminder"
            />
          </FormSection>

          {/* Details */}
          <FormSection
            title="Details"
            description="Additional event information"
            width={12}
          >
            <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
              <TextField
                name="location"
                control={control}
                label="Location"
                placeholder="e.g., Room 101, Auditorium"
              />
              <TextField
                name="link"
                control={control}
                label="Link"
                placeholder="https://..."
              />
            </div>
            <TextField
              name="attendees"
              control={control}
              label="Attendees"
              placeholder="e.g., Grade 7 & 8 Parents, All Staff"
            />
            <TextareaField
              name="notes"
              control={control}
              label="Notes"
              placeholder="Any additional notes..."
              rows={3}
              description="Up to 1,000 characters"
              textareaClassName="field-sizing-fixed min-h-[80px]"
            />
          </FormSection>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-background">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" form="event-form" disabled={isSubmitting}>
          {isSubmitting
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Event' : 'Create Event')}
        </Button>
      </div>
    </div>
  )
}

/**
 * Simple time input field integrated with react-hook-form.
 * Uses native <input type="time"> for browser-native time picking.
 */
function TimeField<_T extends Record<string, unknown>>({
  name,
  control,
  label,
  required,
}: {
  name: string
  control: any
  label: string
  required?: boolean
}) {
  const fieldId = React.useId()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={fieldId}>
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="time"
            value={field.value || ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className={cn(fieldState.error && 'border-destructive')}
          />
          {fieldState.error && (
            <p role="alert" className="text-destructive text-sm">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  )
}
