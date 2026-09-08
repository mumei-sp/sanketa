export type ExpenseCategory = 'Salaries' | 'Supplies' | 'Maintenance' | 'Events' | 'Others'

export type ReimbursementStatus = 'Approved' | 'Declined' | 'Pending'

export interface Expense {
  expenseId: string
  date: string
  department: string
  category: ExpenseCategory
  description: string
  quantity: number | null
  amount: number
}

export interface ExpenseTrendData {
  month: string
  amount: number
}

export interface ExpenseBreakdownData {
  category: ExpenseCategory
  amount: number
  percentage: number
}

export interface Reimbursement {
  requestId: string
  staffName: string
  department: string
  amount: number
  description: string
  dateSubmitted: string
  proofUrl: string
  status: ReimbursementStatus
  /** Who approved or declined it. Absent while still Pending. */
  decidedBy?: string
  /** ISO 8601 timestamp of that decision. */
  decidedAt?: string
}

export interface ExpenseSummary {
  totalExpense: number
  breakdown: ExpenseBreakdownData[]
  trend: ExpenseTrendData[]
  reimbursements: Reimbursement[]
  expenses: Expense[]
}
