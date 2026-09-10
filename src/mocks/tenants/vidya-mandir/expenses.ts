/**
 * Vidya Mandir's ledger.
 *
 * A smaller school spends less, and now says so: the salary line follows its
 * own thirty-three staff and the consumables follow its own 317 children.
 * Shared, both schools bought the same ₹7,500 of graphing calculators on the
 * same day and reported the same total.
 */

import { generateExpenses, type ExpenseFixtures } from '../_generate/expenses'
import { teacherFixtures } from './teachers'
import { studentFixtures } from './students'

export const expenseFixtures: ExpenseFixtures = generateExpenses({
  code: 'vidya-mandir',
  faculty: teacherFixtures,
  studentCount: studentFixtures.length,
  idPrefix: 'VM-',
})
