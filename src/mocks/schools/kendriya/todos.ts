/**
 * What Kendriya's office has on its list.
 *
 * Dated relative to today, so the dashboard's to-do list is never a week of
 * dates in the past.
 */

import type { TodoItem } from '@/features/dashboard/types'
import { relativeDate } from '@/mocks/_shared/date-helpers'

const on = (days: number) =>
  relativeDate(days).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export const todoFixtures: TodoItem[] = [
  { id: 'todo-1', text: 'Review teacher attendance records', date: on(-1), completed: true },
  { id: 'todo-2', text: 'Prepare science fair guidelines', date: on(2), completed: false },
  { id: 'todo-3', text: 'Update library book inventory', date: on(4), completed: false },
  { id: 'todo-4', text: 'Sign off Class 10 board registration list', date: on(6), completed: false },
]
