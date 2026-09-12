/**
 * Expenses API Service
 *
 * Mock path (in-memory expensesData / reimbursementsData / chart datasets)
 * + HTTP path (apiClient). VITE_USE_MOCK_API picks which runs.
 */
import type {
  Expense,
  ExpenseTrendData,
  ExpenseBreakdownData,
  Reimbursement,
} from '@/features/expenses/types'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import * as reimbursementServer from '@/mocks/tenant/reimbursements'
import { emitDomainEvent } from './notification-service'
import { withLatency } from '@/mocks/_shared'
import { callerSeesEveryRow } from '@/mocks/_shared/caller'
import {
  expenseTrendData,
  expenseBreakdownData,
  expensesData,
} from '@/mocks/tenant/expenses'

/**
 * Monthly expense trend datapoints for the chart.
 *
 * @apiRoute GET /api/v1/finance/expenses/trend
 */
export async function fetchExpenseTrend(): Promise<ExpenseTrendData[]> {
  return mockOrHttp(
    async () => {
      // A school's outgoings, summed. Only a caller who may see every fee
      // row may see them totalled — `finance.read` narrows by student, so a
      // family holds it for their own bills and has no business knowing what
      // the school spent.
      if (!callerSeesEveryRow('read', 'Finance')) return []
      await withLatency()
      return [...expenseTrendData]
    },
    async () => {
      const { data } = await apiClient.get<ExpenseTrendData[]>('/finance/expenses/trend')
      return data
    },
  )
}

/**
 * Department-wise expense breakdown + YTD total.
 *
 * @apiRoute GET /api/v1/finance/expenses/breakdown
 */
export async function fetchExpenseBreakdown(): Promise<{
  total: number
  breakdown: ExpenseBreakdownData[]
}> {
  return mockOrHttp(
    async () => {
      await withLatency()
      // Same gate as the trend above: a figure, and one only a caller who sees
      // every fee row may have.
      if (!callerSeesEveryRow('read', 'Finance')) return { total: 0, breakdown: [] }
      // Summed, not typed. `total: 1250000` was a constant sitting beside a
      // breakdown that added to something else entirely, so the donut's
      // centre and its own slices disagreed — ₹12,50,000 over segments
      // totalling ₹2.45 crore.
      return {
        total: expenseBreakdownData.reduce((sum, row) => sum + row.amount, 0),
        breakdown: [...expenseBreakdownData],
      }
    },
    async () => {
      const { data } = await apiClient.get<{ total: number; breakdown: ExpenseBreakdownData[] }>(
        '/finance/expenses/breakdown',
      )
      return data
    },
  )
}

/**
 * Reimbursement requests awaiting approval / tracking.
 *
 * @apiRoute GET /api/v1/finance/reimbursements
 */
export async function fetchReimbursements(): Promise<Reimbursement[]> {
  return mockOrHttp(
    async () => {
      // Staff claims, with names and amounts.
      if (!callerSeesEveryRow('read', 'Finance')) return []
      await withLatency()
      return reimbursementServer.listReimbursements()
    },
    async () => {
      const { data } = await apiClient.get<Reimbursement[]>('/finance/reimbursements')
      return data
    },
  )
}

/**
 * Approve or decline a reimbursement request.
 *
 * `decidedBy` is passed in because the mock has no session to read it from —
 * the same compromise the access log makes, and it disappears the same way: a
 * real server takes the actor off the request's token and ignores anything the
 * client sends.
 *
 * Resolves to a failure rather than throwing when the request was already
 * decided, because that is a normal race between two people looking at the
 * same list, not an error.
 *
 * @apiRoute PATCH /api/v1/finance/reimbursements/{id}
 */
export async function decideReimbursement(
  requestId: string,
  decision: 'Approved' | 'Declined',
  decidedBy: string,
): Promise<{ ok: true; row: Reimbursement } | { ok: false; reason: string }> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const result = reimbursementServer.decideReimbursement(requestId, decision, decidedBy)
      if (result.ok) {
        // The server decides who hears about it; this only reports what
        // happened. See `src/mocks/notifications/rules.ts`.
        emitDomainEvent({
          type: 'reimbursement.decided',
          payload: {
            requestId,
            staffName: result.row.staffName,
            amount: result.row.amount,
            decision,
            decidedBy,
          },
        })
      }
      return result
    },
    async () => {
      const { data } = await apiClient.patch<Reimbursement>(
        `/finance/reimbursements/${requestId}`,
        { status: decision },
      )
      return { ok: true as const, row: data }
    },
  )
}

/**
 * Full expense ledger.
 *
 * @apiRoute GET /api/v1/finance/expenses
 */
export async function fetchExpenses(): Promise<Expense[]> {
  return mockOrHttp(
    async () => {
      // The ledger itself.
      if (!callerSeesEveryRow('read', 'Finance')) return []
      await withLatency()
      return [...expensesData]
    },
    async () => {
      const { data } = await apiClient.get<Expense[]>('/finance/expenses')
      return data
    },
  )
}
