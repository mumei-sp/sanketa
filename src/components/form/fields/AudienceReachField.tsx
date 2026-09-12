/**
 * Who a notice or an event actually reaches.
 *
 * The form half of `config/audience.ts`. The field beside this one takes the
 * prose a school writes — "Grade 9 Students & Parents", "Department Heads, HR"
 * — and nothing can be matched on that, so this collects the same intent in
 * terms the app can answer: which sides, and which year groups.
 *
 * ── Why it is a field and not a picker dialog ──────────────────────────
 * `ClassPicker` already selects grades and is tempting, but it remembers its
 * selection in `localStorage` under a key. That is right for a dashboard,
 * where the last thing you looked at should still be there tomorrow, and wrong
 * for a form: this notice's audience is not the next notice's, and a value
 * that survives the dialog is a value nobody chose.
 *
 * So the state lives where a form's state belongs — in react-hook-form, via
 * `Controller`, like every other field in this folder.
 *
 * ── Everyone is the default and stays the default ──────────────────────
 * Leaving both untouched declares nothing, which reaches the whole board. That
 * is the resting state of a board and the bargain `config/audience.ts`
 * explains; the point of this field is that somebody who means "staff only"
 * now has a way to say so, rather than typing it into prose nothing reads.
 */

import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getUniqueGrades } from '@/utils/class-section-helpers'
import type { AudienceReach } from '@/config/audience'
import type { ContextSide } from '@/config/permissions'

/** The three answers worth offering. More would be a filter, not an audience. */
const SIDE_CHOICES: { id: string; label: string; hint: string; sides?: ContextSide[] }[] = [
  { id: 'everyone', label: 'Everyone', hint: 'Staff and families' },
  { id: 'staff', label: 'Staff only', hint: 'Not visible to families', sides: ['staff'] },
  { id: 'family', label: 'Families only', hint: 'Not visible to staff', sides: ['family'] },
]

function choiceOf(reach: AudienceReach | undefined): string {
  const sides = reach?.sides
  if (!sides || sides.length === 0 || sides.length > 1) return 'everyone'
  return sides[0]
}

export interface AudienceReachFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  description?: string
  className?: string
}

export function AudienceReachField<T extends FieldValues>({
  name,
  control,
  label = 'Who can see this',
  description,
  className,
}: AudienceReachFieldProps<T>) {
  const { config } = useSchoolConfig()
  const grades = React.useMemo(
    () => getUniqueGrades(config.classSections),
    [config.classSections],
  )

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const reach = field.value as AudienceReach | undefined
        const selectedGrades = reach?.grades ?? []
        const choice = choiceOf(reach)

        /**
         * Written back as `undefined` when nothing is restricted, rather than
         * an object of empty arrays. An absent reach is what the reader treats
         * as "everybody", and storing `{ sides: [], grades: [] }` would mean
         * the same thing in a second spelling.
         */
        const commit = (next: AudienceReach) => {
          const cleaned: AudienceReach = {}
          if (next.sides && next.sides.length > 0) cleaned.sides = next.sides
          if (next.grades && next.grades.length > 0) cleaned.grades = next.grades
          field.onChange(Object.keys(cleaned).length > 0 ? cleaned : undefined)
        }

        const toggleGrade = (grade: string) => {
          const next = selectedGrades.includes(grade)
            ? selectedGrades.filter(g => g !== grade)
            : [...selectedGrades, grade]
          // Sorted numerically so '10' sits after '9' rather than after '1',
          // which is where a plain string sort puts it.
          next.sort((a, b) => Number(a) - Number(b))
          commit({ sides: reach?.sides, grades: next })
        }

        return (
          <div className={cn('space-y-3', className)}>
            <Label>{label}</Label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {SIDE_CHOICES.map(option => {
                const active = choice === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => commit({ sides: option.sides, grades: selectedGrades })}
                    className={cn(
                      'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    style={{
                      borderColor: active ? 'var(--heading)' : 'var(--border)',
                      backgroundColor: active ? 'var(--secondary)' : 'var(--card)',
                    }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--heading)' }}
                    >
                      {option.label}
                    </span>
                    <span className="text-caption text-muted-foreground">{option.hint}</span>
                  </button>
                )
              })}
            </div>

            <div className="space-y-2">
              <p className="text-caption text-muted-foreground">
                Year groups — leave all off to reach every year.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {grades.map(grade => {
                  const active = selectedGrades.includes(grade)
                  return (
                    <button
                      key={grade}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleGrade(grade)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-caption font-semibold transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                      style={{
                        borderColor: active ? 'var(--heading)' : 'var(--border)',
                        backgroundColor: active ? 'var(--accent)' : 'var(--card)',
                        color: 'var(--heading)',
                      }}
                    >
                      {grade}
                    </button>
                  )
                })}
              </div>
            </div>

            {description && <p className="text-caption text-muted-foreground">{description}</p>}
          </div>
        )
      }}
    />
  )
}
