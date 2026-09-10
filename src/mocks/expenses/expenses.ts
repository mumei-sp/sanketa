/**
 * The active school's ledger.
 *
 * ── What moved out of here ─────────────────────────────────────────────
 * Forty-eight expense rows, five reimbursements, eight monthly figures and
 * five category totals, all written out and all shared — so both schools
 * bought the same ₹7,500 of graphing calculators on the same day, and the
 * finance page reported the same total for a school of 441 and one of 317.
 *
 * None of the three views agreed with each other either. The breakdown
 * claimed ₹687,500 of salaries against a ledger holding no salary row at all;
 * the trend's August was ₹189,500 against rows that summed to something else.
 * They are all counted off the rows now, in the schools' own folders — see
 * `tenants/_generate/expenses.ts`.
 *
 * Two patch-ups went with them. The rows shipped dated `Mar 1, 2035` and were
 * rewritten at import to scatter across the last 240 days; they are generated
 * at real dates now. And the reimbursement claimants were five invented names
 * — Ananya Sharma, Meera Iyer — overwritten at import with whoever happened
 * to sit at the same index in the faculty list, while their `department`
 * stayed as typed. So Meera Iyengar, who teaches PE, claimed against Arts.
 * A claim now carries the department of the person making it.
 */

import type {
  Expense,
  ExpenseTrendData,
  ExpenseBreakdownData,
  Reimbursement,
} from '@/features/expenses/types'
import { tenantFixtures } from '@/mocks/tenants'

export const expenseTrendData: ExpenseTrendData[] = tenantFixtures().expenses.trend.map(row => ({
  ...row,
}))

export const expenseBreakdownData: ExpenseBreakdownData[] = tenantFixtures().expenses.breakdown.map(
  row => ({ ...row }),
)

export const reimbursementsData: Reimbursement[] = tenantFixtures().expenses.reimbursements.map(
  row => ({ ...row }),
)

export const expensesData: Expense[] = tenantFixtures().expenses.expenses.map(row => ({ ...row }))
