/**
 * Kendriya Vidyalaya's ledger.
 *
 * Sized off its own faculty and its own roster — see
 * `../_generate/expenses.ts` for why a shared ledger could not be either.
 */

import { generateExpenses, type ExpenseFixtures } from '../_generate/expenses'
import { teacherFixtures } from './teachers'
import { studentFixtures } from './students'

export const expenseFixtures: ExpenseFixtures = generateExpenses({
  code: 'kendriya',
  faculty: teacherFixtures,
  studentCount: studentFixtures.length,
  idPrefix: '',
})
