import { z } from 'zod'

/**
 * Extracurricular form schema – validates the "Edit Extracurricular" page form data.
 * Duration is captured as startYear + endYear (endYear can be a year or "Present").
 */

/** Allowed icon keys for display (must match ExtracurricularActivity.iconKey in types). */
const iconKeyEnum = z.enum([
  'swimming',
  'dance',
  'robotics',
  'music',
  'art',
  'sports',
  'other',
])

/**
 * Zod schema for a single extracurricular activity form row.
 * Duration is startYear + endYear; we build the display string "startYear - endYear" on save.
 */
export const ExtracurricularActivitySchema = z.object({
  /** Club or activity name (required) */
  club: z.string().min(1, 'Club name is required'),
  /** Role in the club (optional) */
  role: z.string().optional(),
  /** Achievements or description (optional) */
  achievements: z.string().optional(),
  /** Start year (required) – e.g. "2029" */
  startYear: z.string().min(1, 'Start year is required'),
  /** End year (required) – e.g. "2035" or "Present" */
  endYear: z.string().min(1, 'End year is required'),
  /** Advisor name (required) */
  advisor: z.string().min(1, 'Advisor name is required'),
  /** Icon key for display (optional, must be one of allowed values) */
  iconKey: z.preprocess(
    val => (val === '' || val == null ? undefined : val),
    iconKeyEnum.optional(),
  ),
})

/**
 * Schema for the full extracurricular edit form: list of activities.
 */
export const ExtracurricularFormSchema = z.object({
  activities: z.array(ExtracurricularActivitySchema),
})

/** Inferred type for a single activity in the form */
export type ExtracurricularActivityFormValues = z.infer<
  typeof ExtracurricularActivitySchema
>

/** Inferred type for the full form (activities array) */
export type ExtracurricularFormValues = z.infer<typeof ExtracurricularFormSchema>
