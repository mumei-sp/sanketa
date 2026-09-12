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
import { resolveActiveAccess, resolveActiveSide } from '@/mocks/tenant/profiles'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import type { Student } from '@/features/students/types'

interface FamilyScopeValue {
  /** True when this session is being lived as a family rather than as staff. */
  isFamily: boolean
  /**
   * True when it is being lived as staff.
   *
   * The exact complement of `isFamily`, and nothing reads it today — the five
   * call sites that used to all say `isFamily`. It stays because the pair is
   * the vocabulary the rest of the app thinks in, and `isStaff` reads better
   * at a call site than `!isFamily` will when one wants it.
   *
   * They were independent until recently, and that is worth knowing rather
   * than inferring: capacities are plural, so the teacher whose child attends
   * was family *and* staff at once, and every page broke the tie itself with
   * `isFamily && !isStaff`. She picks a side at the door now, so the tie is
   * broken once and both answers fall out of that one choice.
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

export function FamilyScopeProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useCurrentUser()
  /**
   * Which half of the app this session is in.
   *
   * Read from the side, not from the profile's capacities. They agree for
   * almost everybody — somebody with a parent's role almost always has a
   * `guardians` row too — but a role can be granted before the record exists,
   * and then both capacity tests answer false and false-and-false resolved to
   * staff. A profile holding a parent's role and no guardian row was handed the
   * staff dashboard with a parent's permissions: every tile empty, and the
   * wrong shell around them.
   *
   * The side is the authority. A missing capacity row is a gap in the records,
   * not a statement that somebody is something else — and the bar at the
   * bottom of the screen now says which gap it is.
   */
  const school = activeTenant()
  const access = React.useMemo(
    () => resolveActiveAccess(currentUser?.id),
    // `school` is not passed in, it is read inside — the resolver asks the
    // tenant context which school is active. So it is a real dependency that
    // the linter cannot see, and dropping it would serve the previous
    // school's roles after a switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, school],
  )
  const side = React.useMemo(
    () => resolveActiveSide(currentUser?.id),
    // Same unseen dependency as above: the resolver reads the active school.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, school],
  )
  const isFamily = side === 'family'
  const isStaff = side === 'staff'

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
