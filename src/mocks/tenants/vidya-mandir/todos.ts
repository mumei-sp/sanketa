/**
 * What Vidya Mandir's office has on its list.
 *
 * Its own, and about its own term: the Dasara roster and the half yearly
 * marks, not Kendriya's science fair.
 */

import type { TodoItem } from '@/features/dashboard/types'
import { relativeDate } from '@/mocks/_shared/date-helpers'

const on = (days: number) =>
  relativeDate(days).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export const todoFixtures: TodoItem[] = [
  { id: 'vm-todo-1', text: 'Circulate the Dasara holiday roster', date: on(-2), completed: true },
  { id: 'vm-todo-2', text: 'Collect half yearly marks from Classes 6–10', date: on(1), completed: false },
  { id: 'vm-todo-3', text: 'Confirm two buses for the Chamundi Hill visit', date: on(3), completed: false },
]
