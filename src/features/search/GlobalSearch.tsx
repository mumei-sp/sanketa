/**
 * The command palette behind the top bar's search field and ⌘K.
 *
 * It is a palette rather than a search box: alongside records it carries the
 * things people actually open the bar to *do* — add a student, mark a
 * register — because the fastest route to "create a notice" is typing four
 * letters, not two clicks through a menu.
 *
 * What it searches, and what it deliberately does not: students, teachers and
 * notices by name, plus every destination and a handful of actions. Not the
 * full text of grades, fees or attendance records — that wants a backend index,
 * not a client filtering arrays, and pretending otherwise would mean a palette
 * that misses things without saying so.
 *
 * Records are fetched once when the palette first opens and ranked in memory.
 * At school scale that is instant and costs one round of requests, where a
 * per-keystroke fetch would spend dozens. `useSearchIndex` is the single thing
 * that changes the day a real search endpoint exists.
 *
 * Ranking, highlighting and recents live in `search-index.ts`.
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  CornerDownLeft,
  GraduationCap,
  Users,
  ArrowRight,
  Megaphone,
  Clock,
  Sparkles,
  UserPlus,
  CalendarPlus,
  FilePlus2,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { withOpacity } from '@/theme/colors'
import { fetchStudents } from '@/api/services/student-service'
import { fetchTeachers } from '@/api/services/teacher-service'
import { fetchNoticeBoardEntries } from '@/api/services/notice-board-service'
import { navigationItems, visibleNavigationItems } from '@/config/navigation'
import { usePermissions } from '@/features/auth/PermissionContext'
import { useFamilyScope } from '@/features/family/FamilyScopeContext'
import type { Permission } from '@/config/permissions'
import {
  rankItems,
  highlightParts,
  readRecents,
  rememberRecent,
  type SearchItem,
  type ScoredItem,
  type ResultGroup,
} from './search-index'

// ── The static half of the index ──────────────────────────────────────

/**
 * Things to do, not places to go.
 *
 * Every one lands on a route that opens the relevant form, so the palette
 * never has to reach across the app to trigger a sheet on a page that is not
 * mounted yet.
 */
const ACTIONS: (SearchItem & { permission: Permission })[] = [
  { id: 'act:add-student', label: 'Add student', detail: 'Enrol a new student', route: '/students/add', group: 'Actions', icon: UserPlus, weight: 40, permission: 'students.create' },
  { id: 'act:add-teacher', label: 'Add teacher', detail: 'Add a staff member', route: '/teachers/add', group: 'Actions', icon: UserPlus, weight: 40, permission: 'teachers.manage' },
  { id: 'act:mark-attendance', label: 'Mark attendance', detail: "Today's register", route: '/attendance/daily', group: 'Actions', icon: CheckSquare, weight: 40, permission: 'attendance.mark' },
  { id: 'act:enter-grades', label: 'Enter grades', detail: 'Record exam marks', route: '/grades/entry', group: 'Actions', icon: FilePlus2, weight: 40, permission: 'grades.create' },
  { id: 'act:new-notice', label: 'Create notice', detail: 'Post to the notice board', route: '/notice-board', group: 'Actions', icon: Megaphone, weight: 40, permission: 'notices.manage' },
  { id: 'act:new-event', label: 'Add calendar event', detail: 'Schedule something', route: '/calendar', group: 'Actions', icon: CalendarPlus, weight: 40, permission: 'calendar.manage' },
]

/**
 * Destinations the signed-in role can actually open.
 *
 * Derived from the same filter the sidebar uses, because a palette that
 * indexes the raw config would happily walk someone into a page the navigation
 * hides — the leak nobody notices until an accountant types "expen" and lands
 * on a page they were never meant to see.
 */
function destinationsFor(
  can: (permission: Permission) => boolean,
  /** Family and *not* staff — the caller works that out; see `AppSidebar`. */
  familyOnly: boolean,
): SearchItem[] {
  return visibleNavigationItems(navigationItems, can, familyOnly).flatMap(item =>
    item.children?.length
      ? item.children.map(child => ({
          id: `nav:${child.path}`,
          label: child.title,
          detail: item.title,
          route: child.path,
          group: 'Go to' as const,
        }))
      : [{ id: `nav:${item.path}`, label: item.title, route: item.path, group: 'Go to' as const }],
  )
}

const GROUP_ICONS: Record<ResultGroup, LucideIcon> = {
  Actions: Sparkles,
  'Go to': ArrowRight,
  Students: GraduationCap,
  Teachers: Users,
  Notices: Megaphone,
}

/** Brand tint per group, so the eye sorts results before reading them. */
const GROUP_COLORS: Record<ResultGroup, string> = {
  Actions: 'var(--primary)',
  'Go to': 'var(--heading)',
  Students: 'var(--accent)',
  Teachers: 'var(--accent)',
  Notices: 'var(--primary)',
}

const GROUP_ORDER: ResultGroup[] = ['Actions', 'Go to', 'Students', 'Teachers', 'Notices']

/**
 * What a role must hold for a group's results to be shown.
 *
 * Recents are stored, so they outlive a permission change: someone moved off
 * finance would otherwise still see the fee record they opened last week
 * sitting at the top of an empty palette.
 */
const GROUP_PERMISSION: Partial<Record<ResultGroup, Permission>> = {
  Students: 'students.read',
  Teachers: 'teachers.read',
  Notices: 'notices.read',
}
const RESULT_LIMIT = 12

/** A person's display name — students carry `name`, teachers `fullName`. */
function personName(person: { name?: string; fullName?: string; displayName?: string }) {
  return person.displayName || person.fullName || person.name || undefined
}

/**
 * Records, loaded once per session on first open.
 *
 * Deferred until the palette is actually opened, so a roster never sits on the
 * critical path of a page that may never be searched.
 */
function useSearchIndex(enabled: boolean, can: (permission: Permission) => boolean) {
  const [records, setRecords] = React.useState<SearchItem[] | null>(null)

  const canStudents = can('students.read')
  const canTeachers = can('teachers.read')
  const canNotices = can('notices.read')

  /**
   * What the last successful build was allowed to see.
   *
   * A plain "have we started" latch is wrong here: it can never re-run, so an
   * index built before the roles table landed — or before an admin granted the
   * current user `teachers.view` — stayed empty for the rest of the session
   * while every other surface updated. Keying on the permissions means the
   * index is fetched once per distinct set and rebuilt only when that changes.
   */
  const signature = `${canStudents}|${canTeachers}|${canNotices}`
  const builtRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!enabled || builtRef.current === signature) return
    builtRef.current = signature

    // Only fetch what this role may see. Filtering after the fetch would still
    // put the roster in the browser, which is the part that matters once there
    // is a backend enforcing the same rule.
    Promise.all([
      canStudents ? fetchStudents() : Promise.resolve([]),
      canTeachers ? fetchTeachers() : Promise.resolve([]),
      canNotices ? fetchNoticeBoardEntries() : Promise.resolve([]),
    ])
      .then(([students, teachers, notices]) => {
        setRecords([
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
          ...notices.map(notice => ({
            id: `notice:${notice.id}`,
            label: notice.title,
            detail: [notice.tags[0]?.label, notice.audience].filter(Boolean).join(' · '),
            route: '/notice-board',
            group: 'Notices' as const,
          })),
        ])
      })
      .catch(error => {
        console.error('Failed to build the search index', error)
        setRecords([])
        // Let the next open try again rather than caching the failure.
        builtRef.current = null
      })
  }, [enabled, signature, canStudents, canTeachers, canNotices])

  return records
}

// ── Presentation ──────────────────────────────────────────────────────

function ResultRow({
  item,
  active,
  onSelect,
  onHover,
}: {
  item: ScoredItem
  active: boolean
  onSelect: () => void
  onHover: () => void
}) {
  const Icon = item.icon ?? GROUP_ICONS[item.group]
  const tint = GROUP_COLORS[item.group]

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseMove={onHover}
      data-active={active || undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left',
        'transition-[background-color,transform] duration-150',
        active && 'bg-[color-mix(in_srgb,var(--primary)_16%,transparent)]',
      )}
    >
      {/* Active marker — the same navy tab the sidebar uses for the current
          page, so "where the keyboard is" reads the same everywhere. */}
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0',
        )}
        style={{ backgroundColor: 'var(--heading)' }}
      />

      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors"
        style={{ backgroundColor: withOpacity(tint, active ? 0.28 : 0.14) }}
      >
        <Icon className="size-4" style={{ color: 'var(--heading)' }} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body" style={{ color: 'var(--heading)' }}>
          {highlightParts(item.label, item.matches).map((part, index) =>
            part.hit ? (
              <mark
                key={index}
                className="rounded-[3px] bg-transparent px-0 font-semibold"
                style={{ color: 'var(--heading)', backgroundColor: withOpacity('var(--primary)', 0.45) }}
              >
                {part.text}
              </mark>
            ) : (
              <React.Fragment key={index}>{part.text}</React.Fragment>
            ),
          )}
        </span>
        {item.detail && (
          <span className="truncate text-caption text-muted-foreground">{item.detail}</span>
        )}
      </span>

      <CornerDownLeft
        aria-hidden
        className={cn(
          'size-3.5 shrink-0 text-muted-foreground transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </button>
  )
}

/** ⌘/⌃ depending on platform, so the hint matches the key that works. */
function useModifierSymbol() {
  return React.useMemo(
    () => (typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? '⌘' : 'Ctrl'),
    [],
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground">
      {children}
    </kbd>
  )
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [recents, setRecents] = React.useState<SearchItem[]>([])
  const navigate = useNavigate()
  const { can } = usePermissions()
  const records = useSearchIndex(open, can)
  const { isFamily, isStaff } = useFamilyScope()
  const destinations = React.useMemo(() => destinationsFor(can, isFamily && !isStaff), [can, isFamily, isStaff])
  const actions = React.useMemo(
    () => ACTIONS.filter(action => can(action.permission)),
    [can],
  )
  const modifier = useModifierSymbol()
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    // A stale query from last time is never what ⌘K means.
    setQuery('')
    setActiveIndex(0)
    setRecents(readRecents())
  }, [open])

  const allowedRecents = React.useMemo(
    () =>
      recents.filter(item => {
        const needed = GROUP_PERMISSION[item.group]
        return !needed || can(needed)
      }),
    [recents, can],
  )

  const results = React.useMemo<ScoredItem[]>(() => {
    const term = query.trim()

    // Empty query: what you opened last, then the things you might want to do.
    // Not the roster — a list of every student is not a useful thing to open onto.
    if (!term) {
      const seed = [
        ...allowedRecents.map(item => ({ ...item, score: 0, matches: [] as number[] })),
        ...actions.map(item => ({ ...item, score: 0, matches: [] as number[] })),
      ]
      return seed.slice(0, RESULT_LIMIT)
    }

    return rankItems([...actions, ...destinations, ...(records ?? [])], term, RESULT_LIMIT)
  }, [query, records, allowedRecents, actions, destinations])

  // Group headings are emitted as the group changes, so keyboard indexing stays
  // one flat sequence rather than a nested one.
  const rows = React.useMemo(() => {
    if (!query.trim()) {
      // Preserve recents-then-actions order rather than re-sorting into groups.
      return results.map((item, index) => ({
        item,
        index,
        heading:
          index === 0
            ? allowedRecents.length > 0
              ? 'Recent'
              : 'Quick actions'
            : index === allowedRecents.length && allowedRecents.length > 0
              ? 'Quick actions'
              : null,
      }))
    }
    const seen = new Set<ResultGroup>()
    const ordered = GROUP_ORDER.flatMap(group => results.filter(item => item.group === group))
    return ordered.map((item, index) => {
      const heading = seen.has(item.group) ? null : item.group
      seen.add(item.group)
      return { item, index, heading }
    })
  }, [results, query, allowedRecents])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Keep the highlighted row on screen when arrowing past the fold.
  React.useEffect(() => {
    listRef.current
      ?.querySelector('[data-active]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const select = React.useCallback(
    (item: SearchItem) => {
      setRecents(rememberRecent(item))
      onOpenChange(false)
      navigate(item.route)
    },
    [navigate, onOpenChange],
  )

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (rows.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(index => (index + 1) % rows.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index => (index - 1 + rows.length) % rows.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const row = rows.find(candidate => candidate.index === activeIndex)
      if (row) select(row.item)
    }
  }

  const isIndexing = Boolean(query.trim()) && records === null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'top-[8%] max-w-xl translate-y-0 gap-0 overflow-hidden border-0 p-0',
          // Frosted over the aurora rather than an opaque slab, matching the
          // mobile top bar and the app's card surfaces.
          'glass-card shadow-2xl',
        )}
        style={{
          borderRadius: 'var(--radius-xl, 1rem)',
          boxShadow:
            '0 24px 64px -24px color-mix(in srgb, var(--heading) 45%, transparent), 0 0 0 1px color-mix(in srgb, var(--heading) 10%, transparent)',
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search and commands</DialogTitle>
        </DialogHeader>

        {/* Brand hairline — the one flourish, and it doubles as the seam
            between the query and its results. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent)',
          }}
        />

        <div className="relative flex items-center gap-3 px-4 py-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to…"
            aria-label="Search students, teachers, notices, pages and actions"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            style={{ color: 'var(--heading)' }}
          />
          <Hint>esc</Hint>
        </div>

        <span aria-hidden className="block h-px bg-border/60" />

        <div className="relative">
          {/* Fade at the fold. The list scrolls, and without this the row it
              clips reads as a rendering fault rather than "there is more". */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8"
            style={{
              background:
                'linear-gradient(to top, color-mix(in srgb, var(--card) 80%, transparent), transparent)',
            }}
          />
          <div
            ref={listRef}
            className="scrollbar-thin max-h-[min(26rem,58vh)] overflow-y-auto overscroll-contain p-2"
          >
          {isIndexing ? (
            <div className="space-y-1 p-1">
              {[0, 1, 2, 3].map(row => (
                <Skeleton key={row} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="Nothing found"
              description={`No students, teachers, notices or pages match "${query.trim()}".`}
              className="py-10"
            />
          ) : (
            rows.map(({ item, index, heading }) => (
              <React.Fragment key={item.id}>
                {heading && (
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {heading}
                  </p>
                )}
                <ResultRow
                  item={item}
                  active={index === activeIndex}
                  onSelect={() => select(item)}
                  onHover={() => setActiveIndex(index)}
                />
              </React.Fragment>
              ))
            )}
          </div>
        </div>

        <span aria-hidden className="block h-px bg-border/60" />

        <div className="flex items-center gap-4 px-4 py-2.5 text-[11px] text-muted-foreground">
          {/* Keyboard hints only where there is a keyboard. On a phone they
              describe keys that do not exist, so the count takes their place —
              which is the thing worth knowing when the list is scrolled. */}
          <span className="flex items-center gap-1.5 touch:hidden">
            <Hint>↑</Hint>
            <Hint>↓</Hint>
            navigate
          </span>
          <span className="flex items-center gap-1.5 touch:hidden">
            <Hint>↵</Hint>
            open
          </span>
          <span className="hidden touch:inline">
            {rows.length} {rows.length === 1 ? 'result' : 'results'}
          </span>
          <span className="ml-auto flex items-center gap-1.5 touch:hidden">
            <Clock className="size-3" />
            {modifier} K
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
