/**
 * Mock data for fees collection feature.
 *
 * Pre-populated with 10 students × 4 fee categories.
 * Paid records include payment transaction data.
 * Mutable arrays for mock CRUD operations.
 */

import { CircleCheckBig, CircleDashed, OctagonAlert } from 'lucide-react'
import type {
  FeeStat,
  FeeTrendData,
  FeeProgressData,
  FeeCollectionRecord,
  PaymentTransaction,
  PaymentMethod,
} from '@/features/fees-collection/types'
import { yyyymm, displayDate, relativeDate } from '@/mocks/_shared/date-helpers'
import { studentsData } from '@/mocks/students/students'

/**
 * Look up a student by their `studentId` (e.g. "S-2101") and return the name
 * + class from the canonical studentsData array. Falls back to the caller-
 * supplied defaults if the id isn't found (keeps the mock resilient to
 * student-list edits that drop someone).
 */
function resolveStudent(id: string, fallbackName: string, fallbackClass: string): { name: string; cls: string } {
  const match = studentsData.find(s => s.studentId === id)
  if (!match) return { name: fallbackName, cls: fallbackClass }
  const name =
    match.fullName ||
    match.displayName ||
    match.name ||
    [match.firstName, match.lastName].filter(Boolean).join(' ') ||
    fallbackName
  return { name, cls: match.class || fallbackClass }
}

// ============================================================================
// Dashboard Stats (static — service will compute dynamically)
// ============================================================================

export const feeStats: FeeStat[] = [
  {
    label: 'Fees Collected',
    value: 92500,
    icon: CircleCheckBig,
    iconBg: 'var(--heading)',
    iconColor: 'var(--card)',
  },
  {
    label: 'Pending Fees',
    value: 12300,
    icon: CircleDashed,
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
  },
  {
    label: 'Overdue Payments',
    value: 4750,
    icon: OctagonAlert,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
]

export const feeTrendData: FeeTrendData[] = [
  { month: 'Apr', amount: 68000 },
  { month: 'May', amount: 72000 },
  { month: 'Jun', amount: 65000 },
  { month: 'Jul', amount: 78000 },
  { month: 'Aug', amount: 82000 },
  { month: 'Sep', amount: 75000 },
  { month: 'Oct', amount: 88000 },
  { month: 'Nov', amount: 91000 },
  { month: 'Dec', amount: 85000 },
  { month: 'Jan', amount: 93000 },
  { month: 'Feb', amount: 89000 },
  { month: 'Mar', amount: 92500 },
]

export const feeProgressData: FeeProgressData[] = [
  { category: 'Tuition Fee', percentage: 87.5, collected: 70000, total: 80000, color: 'var(--heading)' },
  { category: 'Books & Supplies', percentage: 87.5, collected: 10500, total: 12000, color: 'var(--heading)' },
  { category: 'Activities', percentage: 90, collected: 7200, total: 8000, color: 'var(--heading)' },
  { category: 'Miscellaneous', percentage: 86.5, collected: 4800, total: 5550, color: 'var(--heading)' },
]

// ============================================================================
// Helpers
// ============================================================================

let txnCounter = 0
function nextTxnId(): string { return `TXN-${yyyymm()}-${String(++txnCounter).padStart(4, '0')}` }
function nextReceiptId(): string { return `REC-${yyyymm()}-${String(txnCounter).padStart(4, '0')}` }

interface FeeInput {
  amount: number
  date: string
  status: FeeCollectionRecord['status']
  paid?: { method: PaymentMethod; paidDate: string }
}

function studentFees(
  id: string,
  fallbackName: string,
  fallbackClass: string,
  fees: { tuition: FeeInput; books: FeeInput; activities: FeeInput; misc: FeeInput },
): FeeCollectionRecord[] {
  // Prefer the canonical student record — falls through to the caller's defaults
  // if the id was dropped / renamed upstream.
  const { name, cls } = resolveStudent(id, fallbackName, fallbackClass)
  function makeRecord(category: FeeCollectionRecord['feeCategory'], f: FeeInput): FeeCollectionRecord {
    const rec: FeeCollectionRecord = {
      studentId: id, studentName: name, class: cls,
      feeCategory: category, totalAmount: f.amount, dueDate: f.date, status: f.status,
    }
    if (f.paid && f.status === 'Paid') {
      const txnId = nextTxnId()
      rec.paidAmount = f.amount
      rec.paidDate = f.paid.paidDate
      rec.paymentMethod = f.paid.method
      rec.transactionId = txnId
      rec.receiptId = nextReceiptId()
    }
    return rec
  }

  return [
    makeRecord('Tuition Fee', fees.tuition),
    makeRecord('Books & Supplies', fees.books),
    makeRecord('Activities', fees.activities),
    makeRecord('Miscellaneous', fees.misc),
  ]
}

// ============================================================================
// Fee Collection Records (mutable)
// ============================================================================

export const feeCollectionData: FeeCollectionRecord[] = [
  ...studentFees('S-2101', 'Michael Chen', '7A', {
    tuition: { amount: 1200, date: 'Mar 15, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 10, 2035' } },
    books: { amount: 250, date: 'Mar 20, 2035', status: 'Pending' },
    activities: { amount: 300, date: 'Mar 25, 2035', status: 'Paid', paid: { method: 'cash', paidDate: 'Mar 20, 2035' } },
    misc: { amount: 150, date: 'Mar 30, 2035', status: 'Partially Paid' },
  }),
  ...studentFees('S-2102', 'Emma Williams', '7B', {
    tuition: { amount: 1200, date: 'Mar 12, 2035', status: 'Partially Paid' },
    books: { amount: 200, date: 'Mar 18, 2035', status: 'Paid', paid: { method: 'cheque', paidDate: 'Mar 14, 2035' } },
    activities: { amount: 250, date: 'Mar 20, 2035', status: 'Pending' },
    misc: { amount: 100, date: 'Mar 28, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 22, 2035' } },
  }),
  ...studentFees('S-2103', 'Rajesh Kumar', '7A', {
    tuition: { amount: 1200, date: 'Mar 10, 2035', status: 'Paid', paid: { method: 'bank_transfer', paidDate: 'Mar 5, 2035' } },
    books: { amount: 280, date: 'Mar 14, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 10, 2035' } },
    activities: { amount: 300, date: 'Mar 18, 2035', status: 'Paid', paid: { method: 'cash', paidDate: 'Mar 14, 2035' } },
    misc: { amount: 120, date: 'Mar 22, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 18, 2035' } },
  }),
  ...studentFees('S-2104', 'Priya Sharma', '7C', {
    tuition: { amount: 1200, date: 'Mar 8, 2035', status: 'Overdue' },
    books: { amount: 230, date: 'Mar 12, 2035', status: 'Pending' },
    activities: { amount: 280, date: 'Mar 16, 2035', status: 'Pending' },
    misc: { amount: 180, date: 'Mar 20, 2035', status: 'Overdue' },
  }),
  ...studentFees('S-2105', 'Hannah Lee', '8A', {
    tuition: { amount: 1350, date: 'Mar 5, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 1, 2035' } },
    books: { amount: 220, date: 'Mar 10, 2035', status: 'Partially Paid' },
    activities: { amount: 300, date: 'Mar 15, 2035', status: 'Pending' },
    misc: { amount: 160, date: 'Mar 20, 2035', status: 'Paid', paid: { method: 'cash', paidDate: 'Mar 15, 2035' } },
  }),
  ...studentFees('S-2106', 'Arjun Patel', '8A', {
    tuition: { amount: 1350, date: 'Mar 7, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 3, 2035' } },
    books: { amount: 240, date: 'Mar 12, 2035', status: 'Paid', paid: { method: 'bank_transfer', paidDate: 'Mar 8, 2035' } },
    activities: { amount: 320, date: 'Mar 17, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 13, 2035' } },
    misc: { amount: 140, date: 'Mar 22, 2035', status: 'Pending' },
  }),
  ...studentFees('S-2107', 'Sophia Martinez', '8B', {
    tuition: { amount: 1350, date: 'Mar 6, 2035', status: 'Partially Paid' },
    books: { amount: 260, date: 'Mar 11, 2035', status: 'Overdue' },
    activities: { amount: 290, date: 'Mar 16, 2035', status: 'Paid', paid: { method: 'cheque', paidDate: 'Mar 12, 2035' } },
    misc: { amount: 170, date: 'Mar 21, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 17, 2035' } },
  }),
  ...studentFees('S-2108', 'Ananya Gupta', '7B', {
    tuition: { amount: 1200, date: 'Mar 9, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 5, 2035' } },
    books: { amount: 210, date: 'Mar 14, 2035', status: 'Paid', paid: { method: 'cash', paidDate: 'Mar 10, 2035' } },
    activities: { amount: 270, date: 'Mar 19, 2035', status: 'Partially Paid' },
    misc: { amount: 130, date: 'Mar 24, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 19, 2035' } },
  }),
  ...studentFees('S-2109', 'Thomas Green', '7C', {
    tuition: { amount: 1200, date: 'Mar 11, 2035', status: 'Pending' },
    books: { amount: 245, date: 'Mar 16, 2035', status: 'Pending' },
    activities: { amount: 310, date: 'Mar 21, 2035', status: 'Paid', paid: { method: 'bank_transfer', paidDate: 'Mar 17, 2035' } },
    misc: { amount: 155, date: 'Mar 26, 2035', status: 'Overdue' },
  }),
  ...studentFees('S-2110', 'Neha Reddy', '8B', {
    tuition: { amount: 1350, date: 'Mar 4, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Feb 28, 2035' } },
    books: { amount: 255, date: 'Mar 9, 2035', status: 'Paid', paid: { method: 'online', paidDate: 'Mar 5, 2035' } },
    activities: { amount: 300, date: 'Mar 14, 2035', status: 'Paid', paid: { method: 'cash', paidDate: 'Mar 10, 2035' } },
    misc: { amount: 145, date: 'Mar 19, 2035', status: 'Paid', paid: { method: 'cheque', paidDate: 'Mar 14, 2035' } },
  }),
]

// ---------------------------------------------------------------------------
// Overwrite hardcoded Mar-2035 due / paid dates with dynamic values.
//
// Due dates scatter across the current quarter (next 90 days) so the fee
// ledger always shows current-quarter items. Paid dates land roughly 5 days
// before the due date so the "paid early" pattern stays plausible.
// Runs before paymentTransactions is derived so the transaction rows pick
// up the new dates.
// ---------------------------------------------------------------------------

feeCollectionData.forEach((record, i) => {
  // Group fees by student so each student's four categories share a window.
  const studentIndex = Math.floor(i / 4)
  const dueOffset = -10 + (studentIndex % 10) * 6 // -10..+44 days relative to today
  const dueDate = relativeDate(dueOffset)
  record.dueDate = displayDate(dueDate)
  if (record.paidDate) {
    record.paidDate = displayDate(relativeDate(dueOffset - 5))
  }
})

// ============================================================================
// Payment Transactions (mutable — built from paid records)
// ============================================================================

export const paymentTransactions: PaymentTransaction[] = feeCollectionData
  .filter(r => r.status === 'Paid' && r.transactionId)
  .map(r => ({
    id: r.transactionId!,
    studentId: r.studentId,
    studentName: r.studentName,
    class: r.class,
    feeCategory: r.feeCategory,
    amount: r.totalAmount,
    method: r.paymentMethod!,
    status: 'success' as const,
    transactionId: r.transactionId!,
    paidDate: r.paidDate!,
    receiptId: r.receiptId!,
  }))

// ============================================================================
// Lookup helpers (for service layer)
// ============================================================================

export function findFeeRecord(studentId: string, feeCategory: string): FeeCollectionRecord | undefined {
  return feeCollectionData.find(r => r.studentId === studentId && r.feeCategory === feeCategory)
}
