import * as React from 'react'
import { FormSection } from '@/components/form/FormSection'
import {
  TextField,
  TextareaField,
  SelectField,
  type SelectOption,
} from '@/components/form/fields'
import type { ExtracurricularFormValues } from '../schemas/extracurricular-schema'
import type { UseFieldArrayReturn } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Options for the Club/Activity type dropdown (icon key).
 * Note: Radix Select does not allow a SelectItem with value="", so we do not add
 * a "none" option; the placeholder shows when the field value is empty/undefined.
 */
const ICON_KEY_OPTIONS: SelectOption[] = [
  { value: 'swimming', label: 'Swimming' },
  { value: 'dance', label: 'Dance' },
  { value: 'robotics', label: 'Robotics' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
]

/** Build year options for start/end year. From (current - 25) to (current + 5). */
function getYearOptions(): SelectOption[] {
  const current = new Date().getFullYear()
  const start = current - 25
  const end = current + 5
  const options: SelectOption[] = []
  for (let y = start; y <= end; y++) {
    options.push({ value: String(y), label: String(y) })
  }
  return options
}

/** Start year options (year only). */
const START_YEAR_OPTIONS = getYearOptions()

/** End year options: same years plus "Present" for ongoing activities. */
const END_YEAR_OPTIONS: SelectOption[] = [
  ...getYearOptions(),
  { value: 'Present', label: 'Present' },
]

export interface ExtracurricularFormProps {
  /** React Hook Form control for the extracurricular form */
  control: Control<ExtracurricularFormValues>
  /** Field array from useExtracurricularForm (append, remove, fields) */
  fieldArray: UseFieldArrayReturn<ExtracurricularFormValues, 'activities'>
  /** Form submit handler from useForm - used to build handleFormSubmit for external Save button */
  handleSubmit: (onValid: (data: ExtracurricularFormValues) => void | Promise<void>) => (e?: React.BaseSyntheticEvent) => Promise<void>
  /** Callback when form is valid and submitted (receives current activities list) */
  onSubmit: (data: ExtracurricularFormValues) => void | Promise<void>
  /** Callback to pass form submit function to parent so Save button can trigger submit */
  onHandlersReady?: (handlers: { handleFormSubmit: () => void }) => void
  /** Optional extra class for the form wrapper */
  className?: string
}

/**
 * ExtracurricularForm - Form for editing a student's extracurricular activities.
 *
 * Renders one FormSection containing a dynamic list of activities. Each activity has:
 * Club, Role, Achievements (textarea), Duration, Advisor, and Type (icon key select).
 * Uses existing shared form components (FormSection, TextField, TextareaField, SelectField).
 * Add/Remove buttons control the list. Parent page wires Save via onHandlersReady.
 */
export function ExtracurricularForm({
  control,
  fieldArray,
  handleSubmit,
  onSubmit,
  onHandlersReady,
  className,
}: ExtracurricularFormProps) {
  const { fields, append, remove } = fieldArray

  // Build the submit handler that runs validation then calls onSubmit with the form data
  const handleFormSubmit = React.useMemo(
    () =>
      handleSubmit(
        data => {
          onSubmit(data)
        },
        errors => {
          console.warn('Extracurricular form validation failed:', errors)
        },
      ),
    [handleSubmit, onSubmit],
  )

  // Expose handleFormSubmit to parent so the page's Save button can trigger form submit
  const onHandlersReadyRef = React.useRef(onHandlersReady)
  React.useEffect(() => {
    onHandlersReadyRef.current = onHandlersReady
  }, [onHandlersReady])
  React.useEffect(() => {
    onHandlersReadyRef.current?.({ handleFormSubmit })
  }, [handleFormSubmit])

  /** Returns a new empty activity object; used when appending a row via "Add activity". */
  const emptyActivity = React.useCallback(
    () => ({
      club: '',
      role: '',
      achievements: '',
      startYear: '',
      endYear: 'Present',
      advisor: '',
      iconKey: undefined as undefined | string,
    }),
    [],
  )

  return (
    <form
      className={cn('w-full', className)}
      onSubmit={handleFormSubmit}
      noValidate
    >
      <FormSection
        title="Extracurricular Activities"
        description="Add or edit clubs, roles, achievements, duration, and advisor for each activity."
        width={12}
      >
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-border bg-muted/30 p-4 space-y-4"
            >
              {/* Row header: label "Activity N" and remove button for this row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Activity {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label={`Remove activity ${index + 1}`}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Fields for this activity; name path is activities.${index}.fieldName for react-hook-form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField<ExtracurricularFormValues>
                  name={`activities.${index}.club`}
                  control={control}
                  label="Club / Activity name"
                  placeholder="e.g. Swimming, Robotics"
                />
                <TextField<ExtracurricularFormValues>
                  name={`activities.${index}.role`}
                  control={control}
                  label="Role"
                  placeholder="e.g. Team Member, Lead Performer"
                />
              </div>
              <TextareaField<ExtracurricularFormValues>
                name={`activities.${index}.achievements`}
                control={control}
                label="Achievements"
                placeholder="e.g. Won 2 Silver Medals (City Meet)"
                rows={2}
              />
              {/* Duration: start year and end year (end year can be "Present" for ongoing) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField<ExtracurricularFormValues>
                  name={`activities.${index}.startYear`}
                  control={control}
                  label="Start year"
                  options={START_YEAR_OPTIONS}
                  placeholder="Select start year"
                />
                <SelectField<ExtracurricularFormValues>
                  name={`activities.${index}.endYear`}
                  control={control}
                  label="End year"
                  options={END_YEAR_OPTIONS}
                  placeholder="Select end year or Present"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField<ExtracurricularFormValues>
                  name={`activities.${index}.advisor`}
                  control={control}
                  label="Advisor"
                  placeholder="e.g. Coach Andrea V."
                />
              </div>
              <SelectField<ExtracurricularFormValues>
                name={`activities.${index}.iconKey`}
                control={control}
                label="Type (for display icon)"
                options={ICON_KEY_OPTIONS}
                placeholder="Select type (optional)"
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append(emptyActivity())}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add activity
          </Button>
        </div>
      </FormSection>
    </form>
  )
}
