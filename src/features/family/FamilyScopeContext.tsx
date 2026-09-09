/**
 * Which child a family account is currently looking at.
 *
 * A student is looking at themselves and never chooses. A parent may have more
 * than one child at the school, and every family screen — attendance, marks,
 * the home page — is about one of them at a time. Holding that choice here
 * rather than in each page means switching child on the attendance screen and
 * then opening marks shows the same child, which is the only behaviour that
 * makes sense once you have two.
 *
 * ── Where the child list comes from ───────────────────────────────────
 * From the profile's `studentIds` — their own record if they are a student
 * here, their children's if they are a parent here.
 *
 * It used to be everything `fetchStudents` returned, on the reasoning that the
 * service already narrows to what the caller may see, so for a parent that
 * *is* their children. True while a family account held one role, and false
 * the moment somebody holds two: a teacher who is also a parent may read the
 * whole roster as a teacher, and the switcher offered her all forty children
 * as though they were hers. "Students I may see" and "my children" were only
 * ever the same list by accident.
 */

import * as React from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { fetchStudents } from '@/api/services/student-service'
import { resolveTenantAccess, type Capacity } from '@/mocks/profiles'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import type { Student } from '@/features/students/types'

interface FamilyScopeValue {
  /** True when this account has a student or parent record at this school. */
  isFamily: boolean
  /**
   * True when it *also* has an employment record here.
   *
   * The two are not exclusive, which is the whole point. A page that swaps
   * itself for the family variant has to ask both: the teacher whose child
   * attends still needs the staff attendance register, and gains her son's
   * record rather than trading her job for it.
   */
  isStaff: boolean
  /** The students this account may see. Their own, or their children. */
  children: Student[]
  /** The one on screen, or null while loading or if there are none. */
  selected: Student | null
  selectChild: (studentId: string) => void
  isLoading: boolean
}

const FamilyScopeContext = React.createContext<FamilyScopeValue | null>(null)

/**
 * Capacities that make somebody family rather than school.
 *
 * `guardian` is not here because it is not a capacity — a guardian has a
 * `parents` record, and the distinction lives in `student_parents.relationship`
 * where it belongs.
 */
const FAMILY_CAPACITIES: Capacity[] = ['student', 'parent']

/** Capacities that make somebody school rather than family. Not exclusive. */
const STAFF_CAPACITIES: Capacity[] = ['teacher', 'staff']

export function FamilyScopeProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useCurrentUser()
  /**
   * Whether this account has a family record at the school in view.
   *
   * Read from the profile's capacities, not from `profileType` on the session.
   * The member of staff whose child attends the school is a teacher *and* a
   * parent, and a single kind on the session had to pick one — which meant one
   * of her two schools, or one of her two jobs, got the wrong app. Being a
   * family member here is having a `students` or `parents` record here.
   */
  const school = activeTenant()
  const access = React.useMemo(
    () => resolveTenantAccess(currentUser?.id),
    // `school` is not passed in, it is read inside — the resolver asks the
    // tenant context which school is active. So it is a real dependency that
    // the linter cannot see, and dropping it would serve the previous
    // school's roles after a switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, school],
  )
  const isFamily = access.capacities.some(capacity => FAMILY_CAPACITIES.includes(capacity))
  const isStaff = access.capacities.some(capacity => STAFF_CAPACITIES.includes(capacity))

  const [students, setStudents] = React.useState<Student[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(isFamily)

  React.useEffect(() => {
    if (!isFamily) {
      setIsLoading(false)
      return
    }
    const mine = new Set(access.studentIds)
    fetchStudents()
      .then(rows => {
        // Narrowed to the children on their profile. The service read is still
        // the right one to make — it is filtered, so it cannot return somebody
        // this caller may not see — but which of those are *theirs* is the
        // link table's answer, not the filter's.
        const own = rows.filter(row => mine.has(String(row.id)))
        setStudents(own)
        // Default to the first, so a page never has to render "pick a child"
        // before it can show anything — with one child there is no choice to
        // make, and with two the switcher is right there.
        setSelectedId(current => current ?? (own[0] ? String(own[0].id) : null))
      })
      .catch(error => console.error('Failed to load the family roster', error))
      .finally(() => setIsLoading(false))
  }, [isFamily, access.studentIds])

  const value = React.useMemo<FamilyScopeValue>(() => {
    const selected = students.find(student => String(student.id) === selectedId) ?? null
    return {
      isFamily,
      isStaff,
      children: students,
      selected,
      selectChild: setSelectedId,
      isLoading,
    }
  }, [isFamily, isStaff, students, selectedId, isLoading])

  return <FamilyScopeContext.Provider value={value}>{children}</FamilyScopeContext.Provider>
}

export function useFamilyScope(): FamilyScopeValue {
  const context = React.useContext(FamilyScopeContext)
  if (!context) throw new Error('useFamilyScope must be used inside a FamilyScopeProvider')
  return context
}
