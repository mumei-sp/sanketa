/**
 * Fees collection service — mock CRUD operations for fee management.
 *
 * All functions simulate network delay and operate on in-memory mock data.
 * Replace with real API calls when backend is ready.
 */

import { CircleCheckBig, CircleDashed, OctagonAlert } from 'lucide-react'
import { baseColors } from '@/theme/colors'
import type {
  FeeStat,
  FeeTrendData,
  FeeProgressData,
  FeeCollectionRecord,
  PaymentTransaction,
  PaymentMethod,
  Receipt,
  FeeCategory,
} from '@/features/fees-collection/types'
import {
  feeTrendData,
  feeProgressData,
  feeCollectionData,
  paymentTransactions,
  findFeeRecord,
} from '@/features/fees-collection/mocks'

// ============================================================================
// Helpers
// ============================================================================

function randomDelay(): number {
  return Math.floor(Math.random() * 500) + 300
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// Dashboard Stats (computed dynamically from mutable data)
// ============================================================================

export async function fetchFeeStats(): Promise<FeeStat[]> {
  await delay(randomDelay())

  let collected = 0
  let pending = 0
  let overdue = 0

  feeCollectionData.forEach(r => {
    if (r.status === 'Paid') collected += r.totalAmount
    else if (r.status === 'Pending' || r.status === 'Partially Paid') pending += r.totalAmount
    else if (r.status === 'Overdue') overdue += r.totalAmount
  })

  return [
    { label: 'Fees Collected', value: collected, icon: CircleCheckBig, iconBg: baseColors.heading, iconColor: '#FFFFFF' },
    { label: 'Pending Fees', value: pending, icon: CircleDashed, iconBg: baseColors.blue, iconColor: baseColors.heading },
    { label: 'Overdue Payments', value: overdue, icon: OctagonAlert, iconBg: baseColors.pink, iconColor: baseColors.heading },
  ]
}

// ============================================================================
// Existing Fetch Functions
// ============================================================================

export async function fetchFeeTrend(): Promise<FeeTrendData[]> {
  await delay(randomDelay())
  return [...feeTrendData]
}

export async function fetchFeeProgress(): Promise<FeeProgressData[]> {
  await delay(randomDelay())
  return [...feeProgressData]
}

export async function fetchFeeCollection(): Promise<FeeCollectionRecord[]> {
  await delay(randomDelay())
  return feeCollectionData.map(r => ({ ...r }))
}

// ============================================================================
// Mark as Paid
// ============================================================================

export async function markAsPaid(params: {
  studentId: string
  feeCategory: FeeCategory
  amount: number
  method: PaymentMethod
  transactionId: string
  paidDate: string
  notes?: string
}): Promise<PaymentTransaction> {
  await delay(400, 700)

  const record = findFeeRecord(params.studentId, params.feeCategory)
  if (!record) throw new Error('Fee record not found')

  const txnId = params.transactionId || `TXN-${Date.now()}`
  const receiptId = `REC-${Date.now()}`
  const paidDate = params.paidDate

  // Update the fee record
  record.status = 'Paid'
  record.paidAmount = params.amount
  record.paidDate = paidDate
  record.paymentMethod = params.method
  record.transactionId = txnId
  record.receiptId = receiptId

  // Create transaction
  const transaction: PaymentTransaction = {
    id: txnId,
    studentId: params.studentId,
    studentName: record.studentName,
    class: record.class,
    feeCategory: record.feeCategory,
    amount: params.amount,
    method: params.method,
    status: 'success',
    transactionId: txnId,
    paidDate,
    receiptId,
  }

  paymentTransactions.push(transaction)
  return { ...transaction }
}

// ============================================================================
// Payment History
// ============================================================================

export async function fetchPaymentHistory(studentId?: string): Promise<PaymentTransaction[]> {
  await delay(randomDelay())
  const filtered = studentId
    ? paymentTransactions.filter(t => t.studentId === studentId)
    : paymentTransactions
  return filtered.map(t => ({ ...t }))
}

// ============================================================================
// Receipt Generation
// ============================================================================

export async function generateReceipt(transactionId: string, schoolName: string): Promise<Receipt | null> {
  await delay(300)
  const txn = paymentTransactions.find(t => t.transactionId === transactionId)
  if (!txn) return null

  return {
    id: txn.receiptId,
    receiptNumber: txn.receiptId,
    transactionId: txn.transactionId,
    studentId: txn.studentId,
    studentName: txn.studentName,
    class: txn.class,
    feeCategory: txn.feeCategory,
    amount: txn.amount,
    paidDate: txn.paidDate,
    paymentMethod: txn.method,
    schoolName,
  }
}
