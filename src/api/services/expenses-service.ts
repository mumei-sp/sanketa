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
import { withLatency } from '@/mocks/_shared'
import {
  expenseTrendData,
  expenseBreakdownData,
  reimbursementsData,
  expensesData,
} from '@/mocks/expenses'

/**
 * Monthly expense trend datapoints for the chart.
 *
 * @apiRoute GET /api/v1/finance/expenses/trend
 */
export async function fetchExpenseTrend(): Promise<ExpenseTrendData[]> {
  return mockOrHttp(
    async () => {
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
      return { total: 1250000, breakdown: [...expenseBreakdownData] }
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
      await withLatency()
      return [...reimbursementsData]
    },
    async () => {
      const { data } = await apiClient.get<Reimbursement[]>('/finance/reimbursements')
      return data
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
      await withLatency()
      return [...expensesData]
    },
    async () => {
      const { data } = await apiClient.get<Expense[]>('/finance/expenses')
      return data
    },
  )
}
