/**
 * Fee collection type definitions.
 *
 * Covers fee records, payment transactions, receipts, and dashboard stats.
 */

// ============================================================================
// Fee Records
// ============================================================================

export type FeeCategory = 'Tuition Fee' | 'Books & Supplies' | 'Activities' | 'Miscellaneous'
export type FeeStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Overdue'

export interface FeeCollectionRecord {
  studentId: string
  studentName: string
  class: string
  feeCategory: FeeCategory
  totalAmount: number
  dueDate: string
  status: FeeStatus
  /** Populated after payment */
  paidAmount?: number
  paidDate?: string
  paymentMethod?: PaymentMethod
  transactionId?: string
  receiptId?: string
}

// ============================================================================
// Payment
// ============================================================================

export type PaymentMethod = 'online' | 'cash' | 'cheque' | 'bank_transfer'
export type PaymentGateway = 'razorpay' | 'paytm'
export type TransactionStatus = 'success' | 'failed' | 'pending'

export interface PaymentTransaction {
  id: string
  studentId: string
  studentName: string
  class: string
  feeCategory: FeeCategory
  amount: number
  method: PaymentMethod
  gateway?: PaymentGateway
  status: TransactionStatus
  transactionId: string
  paidDate: string
  receiptId: string
}

export interface Receipt {
  id: string
  receiptNumber: string
  transactionId: string
  studentId: string
  studentName: string
  class: string
  feeCategory: FeeCategory
  amount: number
  paidDate: string
  paymentMethod: PaymentMethod
  schoolName: string
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface FeeStat {
  label: string
  value: number
  icon: import('lucide-react').LucideIcon
  iconBg: string
  iconColor: string
}

export interface FeeTrendData {
  month: string
  amount: number
}

export interface FeeProgressData {
  category: FeeCategory
  percentage: number
  collected: number
  total: number
  color: string
}

// ============================================================================
// Constants
// ============================================================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  online: 'Online',
  cash: 'Cash',
  cheque: 'Cheque',
  bank_transfer: 'Bank Transfer',
}

export const PAYMENT_GATEWAY_LABELS: Record<PaymentGateway, string> = {
  razorpay: 'Razorpay',
  paytm: 'Paytm',
}
