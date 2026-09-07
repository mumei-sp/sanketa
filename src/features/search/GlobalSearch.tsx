/**
 * Global search — the top bar's search field, made real.
 *
 * The field had a placeholder and a ⌘K hint and did nothing, which is worse
 * than no field: it advertises a capability and then swallows what you type.
 *
 * Scope is deliberately narrow. It searches the two record types someone
 * actually hunts for by name — students and teachers — plus the app's own
 * destinations, so "expen" jumps to Expenses. It is not a full-text search
 * over notices, grades and fees; that wants a backend index, not a client
 * filtering arrays.
 *
 * People are fetched once when the dialog first opens and filtered in memory.
 * With a school-sized roster that is instant and costs one request, where a
 * per-keystroke round trip would spend dozens. When a real search endpoint
 * exists, `useSearchIndex` is the one thing that changes.
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, GraduationCap, Users, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { fetchStudents } from '@/api/services/student-service'
import { fetchTeachers } from '@/api/services/teacher-service'
import { navigationItems } from '@/config/navigation'

interface SearchResult {
  id: string
  label: string
  detail?: string
  route: string
  group: 'Go to' | 'Students' | 'Teachers'
}

/** Flatten navigation into destinations, parents included via their children. */
function collectDestinations(): SearchResult[] {
  const out: SearchResult[] = []
  navigationItems.forEach(item => {
    if (item.children?.length) {
      item.children.forEach(child => {
        out.push({
          id: `nav:${child.path}`,
          label: child.title,
          detail: item.title,
          route: child.path,
          group: 'Go to',
        })
      })
    } else {
      out.push({ id: `nav:${item.path}`, label: item.title, route: item.path, group: 'Go to' })
    }
  })
  return out
}

const DESTINATIONS = collectDestinations()

/**
 * A person's display name.
 *
 * The two record types disagree: students carry `name`, teachers carry
 * `fullName` / `displayName` from the shared UserProfile shape. Rather than
 * pick one and quietly show ids for the other, take whichever is populated.
 */
function personName(person: {
  name?: string
  fullName?: string
  displayName?: string
}): string | undefined {
  return person.displayName || person.fullName || person.name || undefined
}

/**
 * People, loaded once per session on first open.
 *
 * Deferred until the dialog is actually opened so the roster never sits on the
 * critical path of a page that may never search.
 */
function useSearchIndex(enabled: boolean) {
  const [people, setPeople] = React.useState<SearchResult[] | null>(null)
  const loadingRef = React.useRef(false)

  React.useEffect(() => {
    if (!enabled || people !== null || loadingRef.current) return
    loadingRef.current = true

    Promise.all([fetchStudents(), fetchTeachers()])
      .then(([students, teachers]) => {
        setPeople([
          ...students.map(student => ({
            id: `student:${student.studentId}`,
            label: personName(student) ?? student.studentId,
            detail: [student.studentId, student.class].filter(Boolean).join(' · '),
            route: `/students/details/${student.studentId}`,
            group: 'Students' as const,
          })),
          ...teachers.map(teacher => ({
            id: `teacher:${teacher.teacherId}`,
            label: personName(teacher) ?? teacher.teacherId,
            detail: [teacher.teacherId, teacher.subject].filter(Boolean).join(' · '),
            route: `/teachers/details/${teacher.teacherId}`,
            group: 'Teachers' as const,
          })),
        ])
      })
      .catch(error => {
        console.error('Failed to build the search index', error)
        setPeople([])
      })
      .finally(() => {
        loadingRef.current = false
      })
  }, [enabled, people])

  return people
}

const GROUP_ICONS = {
  'Go to': ArrowRight,
  Students: GraduationCap,
  Teachers: Users,
} as const

/** Cap per group so one big roster cannot bury the others. */
const PER_GROUP_LIMIT = 5

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const navigate = useNavigate()
  const people = useSearchIndex(open)

  // Start clean on every open — a stale query from last time is never what
  // someone means by pressing ⌘K.
  React.useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  const results = React.useMemo<SearchResult[]>(() => {
    const term = query.trim().toLowerCase()
    // With no query, destinations alone: a list of every student in the school
    // is not a useful thing to open onto.
    const pool = term ? [...DESTINATIONS, ...(people ?? [])] : DESTINATIONS
    const matched = term
      ? pool.filter(
          item =>
            item.label.toLowerCase().includes(term) ||
            (item.detail?.toLowerCase().includes(term) ?? false),
        )
      : pool

    const groups: SearchResult['group'][] = ['Go to', 'Students', 'Teachers']
    return groups.flatMap(group =>
      matched.filter(item => item.group === group).slice(0, PER_GROUP_LIMIT),
    )
  }, [query, people])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const select = React.useCallback(
    (result: SearchResult) => {
      onOpenChange(false)
      navigate(result.route)
    },
    [navigate, onOpenChange],
  )

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(index => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index => (index - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      select(results[activeIndex])
    }
  }

  // Headings are emitted as the group changes down the flat list, so keyboard
  // indexing stays a single sequence rather than a nested one.
  let lastGroup: SearchResult['group'] | null = null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[10%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0 [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <div className="relative border-b">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search students, teachers and pages"
            aria-label="Search students, teachers and pages"
            className="h-12 rounded-none border-0 pl-11 text-sm shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="scrollbar-thin max-h-[min(24rem,60vh)] overflow-y-auto p-2">
          {query && people === null ? (
            <div className="space-y-1 p-1">
              {[0, 1, 2].map(row => (
                <Skeleton key={row} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No matches"
              description={`Nothing for "${query}".`}
              className="py-10"
            />
          ) : (
            results.map((result, index) => {
              const Icon = GROUP_ICONS[result.group]
              const heading = result.group !== lastGroup ? result.group : null
              lastGroup = result.group

              return (
                <React.Fragment key={result.id}>
                  {heading && (
                    <p className="px-2 pt-2 pb-1 text-caption font-medium text-muted-foreground">
                      {heading}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => select(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                      index === activeIndex ? 'bg-muted' : 'hover:bg-muted/60',
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        className="truncate text-body font-medium"
                        style={{ color: 'var(--heading)' }}
                      >
                        {result.label}
                      </span>
                      {result.detail && (
                        <span className="truncate text-caption text-muted-foreground">
                          {result.detail}
                        </span>
                      )}
                    </span>
                    {index === activeIndex && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </React.Fragment>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Opens the dialog on ⌘K / Ctrl-K.
 *
 * Bound at the shell so the shortcut works from any page, and suppressed while
 * a text field has focus so it never eats a keystroke someone meant for a form.
 */
export function useGlobalSearchShortcut(onOpen: () => void) {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      event.preventDefault()
      onOpen()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}
