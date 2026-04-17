import type {
  Expense,
  ExpenseTrendData,
  ExpenseBreakdownData,
  Reimbursement,
} from '@/features/expenses/types'
import {
  expenseTrendData,
  expenseBreakdownData,
  reimbursementsData,
  expensesData,
} from '@/mocks/expenses'

export async function fetchExpenseTrend(): Promise<ExpenseTrendData[]> {
  const delay = Math.floor(Math.random() * 500) + 300
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...expenseTrendData])
    }, delay)
  })
}

export async function fetchExpenseBreakdown(): Promise<{
  total: number
  breakdown: ExpenseBreakdownData[]
}> {
  const delay = Math.floor(Math.random() * 500) + 300
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        total: 1250000,
        breakdown: [...expenseBreakdownData],
      })
    }, delay)
  })
}

export async function fetchReimbursements(): Promise<Reimbursement[]> {
  const delay = Math.floor(Math.random() * 500) + 300
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...reimbursementsData])
    }, delay)
  })
}

export async function fetchExpenses(): Promise<Expense[]> {
  const delay = Math.floor(Math.random() * 500) + 300
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...expensesData])
    }, delay)
  })
}
