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
import { X } from 'lucide-react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getUniqueGrades } from '@/utils/class-section-helpers'
import { Input } from '@/components/ui/input'
import { fetchDirectory, type DirectoryEntry } from '@/api/services/directory-service'
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


/** How many matches to put on screen at once. A list nobody scrolls is a list. */
const MATCH_LIMIT = 8

/**
 * Naming particular people.
 *
 * A search box rather than a list, because a school is eleven hundred people
 * and a `<select>` of eleven hundred is not a control. Nothing renders until
 * somebody types, so the common case — an audience described by side and year
 * — costs one line of text and no list at all.
 */
function PeoplePicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [directory, setDirectory] = React.useState<DirectoryEntry[]>([])
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    void fetchDirectory()
      .then(rows => {
        if (!cancelled) setDirectory(rows)
      })
      .catch(() => {
        // Nothing to offer beats a half-list: a caller who may not read the
        // roster gets an empty directory from the service anyway.
        if (!cancelled) setDirectory([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const byId = React.useMemo(
    () => new Map(directory.map(entry => [entry.profileId, entry])),
    [directory],
  )

  const matches = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []
    return directory
      .filter(entry => !selected.includes(entry.profileId))
      .filter(entry => entry.name.toLowerCase().includes(needle))
      .slice(0, MATCH_LIMIT)
  }, [directory, query, selected])

  const add = (profileId: string) => {
    onChange([...selected, profileId])
    setQuery('')
  }

  return (
    <div className="space-y-2">
      <p className="text-caption text-muted-foreground">
        Named people — they see it whatever the choices above say.
      </p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(profileId => (
            <span
              key={profileId}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-semibold"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--secondary)',
                color: 'var(--heading)',
              }}
            >
              {/* A tag for somebody no longer in the directory still shows its
                  id, so a stale addressee is visible rather than silently
                  vanishing from the audience it is part of. */}
              {byId.get(profileId)?.name ?? profileId}
              <button
                type="button"
                onClick={() => onChange(selected.filter(id => id !== profileId))}
                aria-label={`Remove ${byId.get(profileId)?.name ?? profileId}`}
                className="rounded-full p-0.5 transition-opacity hover:opacity-60"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search people by name…"
          aria-label="Search people to add to this audience"
        />
        {matches.length > 0 && (
          <ul
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border shadow-lg"
            style={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)' }}
          >
            {matches.map(entry => (
              <li key={entry.profileId}>
                <button
                  type="button"
                  onClick={() => add(entry.profileId)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                    {entry.name}
                  </span>
                  <span className="text-caption text-muted-foreground">{entry.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
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
          if (next.profileIds && next.profileIds.length > 0) cleaned.profileIds = next.profileIds
          field.onChange(Object.keys(cleaned).length > 0 ? cleaned : undefined)
        }

        const toggleGrade = (grade: string) => {
          const next = selectedGrades.includes(grade)
            ? selectedGrades.filter(g => g !== grade)
            : [...selectedGrades, grade]
          // Sorted numerically so '10' sits after '9' rather than after '1',
          // which is where a plain string sort puts it.
          next.sort((a, b) => Number(a) - Number(b))
          commit({ sides: reach?.sides, grades: next, profileIds: reach?.profileIds })
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
                    onClick={() => commit({ sides: option.sides, grades: selectedGrades, profileIds: reach?.profileIds })}
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

            <PeoplePicker
              selected={reach?.profileIds ?? []}
              onChange={profileIds =>
                commit({ sides: reach?.sides, grades: selectedGrades, profileIds })
              }
            />

            {description && <p className="text-caption text-muted-foreground">{description}</p>}
          </div>
        )
      }}
    />
  )
}
