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
 * The list is not fetched from a "my children" endpoint, because there is no
 * need for one: `fetchStudents` already returns exactly the students this
 * caller may see, filtered at the service. For a parent that *is* their
 * children. One less endpoint, and one less place for the two answers to
 * disagree.
 */

import * as React from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { fetchStudents } from '@/api/services/student-service'
import type { Student } from '@/features/students/types'

interface FamilyScopeValue {
  /** True for a student, parent or guardian account. */
  isFamily: boolean
  /** The students this account may see. Their own, or their children. */
  children: Student[]
  /** The one on screen, or null while loading or if there are none. */
  selected: Student | null
  selectChild: (studentId: string) => void
  isLoading: boolean
}

const FamilyScopeContext = React.createContext<FamilyScopeValue | null>(null)

const FAMILY_KINDS = ['student', 'parent', 'guardian']

export function FamilyScopeProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useCurrentUser()
  const isFamily = FAMILY_KINDS.includes(currentUser?.profileType ?? '')

  const [students, setStudents] = React.useState<Student[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(isFamily)

  React.useEffect(() => {
    if (!isFamily) {
      setIsLoading(false)
      return
    }
    fetchStudents()
      .then(rows => {
        setStudents(rows)
        // Default to the first, so a page never has to render "pick a child"
        // before it can show anything — with one child there is no choice to
        // make, and with two the switcher is right there.
        setSelectedId(current => current ?? (rows[0] ? String(rows[0].id) : null))
      })
      .catch(error => console.error('Failed to load the family roster', error))
      .finally(() => setIsLoading(false))
  }, [isFamily])

  const value = React.useMemo<FamilyScopeValue>(() => {
    const selected = students.find(student => String(student.id) === selectedId) ?? null
    return {
      isFamily,
      children: students,
      selected,
      selectChild: setSelectedId,
      isLoading,
    }
  }, [isFamily, students, selectedId, isLoading])

  return <FamilyScopeContext.Provider value={value}>{children}</FamilyScopeContext.Provider>
}

export function useFamilyScope(): FamilyScopeValue {
  const context = React.useContext(FamilyScopeContext)
  if (!context) throw new Error('useFamilyScope must be used inside a FamilyScopeProvider')
  return context
}
