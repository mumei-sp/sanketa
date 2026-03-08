import * as React from 'react'
import {
  useForm,
  useFieldArray,
  type UseFormReturn,
  type FieldErrors,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ExtracurricularActivity } from '@/features/students/types'
import {
  ExtracurricularFormSchema,
  type ExtracurricularFormValues,
} from '../schemas/extracurricular-schema'

/**
 * Return type for useExtracurricularForm.
 * Exposes control, errors, handleSubmit, and field array helpers for the activities list.
 */
export interface UseExtracurricularFormReturn {
  /** React Hook Form control for Controller components */
  control: UseFormReturn<ExtracurricularFormValues>['control']
  /** Validation errors per field */
  errors: FieldErrors<ExtracurricularFormValues>
  /** Form submit handler (runs validation, then callback on success) */
  handleSubmit: UseFormReturn<ExtracurricularFormValues>['handleSubmit']
  /** Field array for "activities" - append, remove, and current fields */
  fieldArray: ReturnType<typeof useFieldArray<ExtracurricularFormValues, 'activities'>>
}

/**
 * Parses a duration string like "2029 - Present" or "2023 - 2025" into startYear and endYear.
 * Used when loading existing activities into the form.
 */
function parseDuration(duration: string | undefined): { startYear: string; endYear: string } {
  if (!duration || !duration.trim()) return { startYear: '', endYear: '' }
  const parts = duration.split(/\s*-\s*/).map(p => p.trim())
  if (parts.length >= 2) {
    const start = parts[0]
    const end = parts[1]
    return {
      startYear: /^\d{4}$/.test(start) ? start : '',
      endYear: /^\d{4}$/.test(end) ? end : end.toLowerCase() === 'present' ? 'Present' : end || '',
    }
  }
  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
    return { startYear: parts[0], endYear: 'Present' }
  }
  return { startYear: '', endYear: '' }
}

/**
 * Transforms a student's extracurricular activities into form default values.
 * Parses duration string into startYear and endYear for the year inputs.
 */
function activitiesToFormDefault(
  activities: ExtracurricularActivity[] | undefined,
): ExtracurricularFormValues {
  const list = activities ?? []
  return {
    activities: list.map(a => {
      const { startYear, endYear } = parseDuration(a.duration)
      return {
        club: a.club ?? '',
        role: a.role ?? '',
        achievements: a.achievements ?? '',
        startYear,
        endYear: endYear || 'Present',
        advisor: a.advisor ?? '',
        iconKey: a.iconKey ?? undefined,
      }
    }),
  }
}

/**
 * Headless form hook for the extracurricular activities edit form.
 * Uses React Hook Form + Zod and useFieldArray for dynamic add/remove of activities.
 *
 * @param defaultActivities - Optional list from student (e.g. student.extracurricularActivities)
 * @returns control, errors, handleSubmit, and fieldArray for use in ExtracurricularForm
 */
export function useExtracurricularForm(
  defaultActivities?: ExtracurricularActivity[],
): UseExtracurricularFormReturn {
  const defaultValues = activitiesToFormDefault(defaultActivities)

  const form = useForm<ExtracurricularFormValues>({
    resolver: zodResolver(ExtracurricularFormSchema),
    defaultValues: defaultValues.activities.length > 0
      ? defaultValues
      : { activities: [{ club: '', role: '', achievements: '', startYear: '', endYear: 'Present', advisor: '', iconKey: undefined }] },
  })

  // When student loads after the first render, defaultActivities goes from undefined to the real list.
  // React Hook Form only uses defaultValues on init, so we reset the form when activities become available.
  // This ensures the edit page shows existing activities instead of staying empty.
  React.useEffect(() => {
    if (defaultActivities != null && defaultActivities.length > 0) {
      form.reset(activitiesToFormDefault(defaultActivities))
    }
  }, [defaultActivities, form])

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'activities',
  })

  return {
    control: form.control,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    fieldArray,
  }
}
