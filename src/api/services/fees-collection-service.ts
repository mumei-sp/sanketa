/**
 * Fees Collection API Service
 *
 * Mock path + HTTP path per endpoint. VITE_USE_MOCK_API picks which runs.
 */

import { CircleCheckBig, CircleDashed, OctagonAlert } from 'lucide-react'
import { baseColors } from '@/theme/colors'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, txnId, newId } from '@/mocks/_shared'
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
} from '@/mocks/fees'

// ---------------------------------------------------------------------------
// Dashboard Stats (computed dynamically from mutable data)
// ---------------------------------------------------------------------------

/**
 * Fee summary stats (collected / pending / overdue).
 *
 * @apiRoute GET /api/v1/finance/fees/stats
 */
export async function fetchFeeStats(): Promise<FeeStat[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      let collected = 0
      let pending = 0
      let overdue = 0
      feeCollectionData.forEach(r => {
        if (r.status === 'Paid') collected += r.totalAmount
        else if (r.status === 'Pending' || r.status === 'Partially Paid') pending += r.totalAmount
        else if (r.status === 'Overdue') overdue += r.totalAmount
      })
      return [
        { label: 'Fees Collected', value: collected, icon: CircleCheckBig, iconBg: 'var(--heading)', iconColor: 'var(--card)' },
        { label: 'Pending Fees', value: pending, icon: CircleDashed, iconBg: 'var(--accent)', iconColor: 'var(--accent-foreground)' },
        { label: 'Overdue Payments', value: overdue, icon: OctagonAlert, iconBg: 'var(--primary)', iconColor: 'var(--primary-foreground)' },
      ]
    },
    async () => {
      const { data } = await apiClient.get<{ collected: number; pending: number; overdue: number }>(
        '/finance/fees/stats',
      )
      return [
        { label: 'Fees Collected', value: data.collected, icon: CircleCheckBig, iconBg: 'var(--heading)', iconColor: 'var(--card)' },
        { label: 'Pending Fees', value: data.pending, icon: CircleDashed, iconBg: 'var(--accent)', iconColor: 'var(--accent-foreground)' },
        { label: 'Overdue Payments', value: data.overdue, icon: OctagonAlert, iconBg: 'var(--primary)', iconColor: 'var(--primary-foreground)' },
      ]
    },
  )
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** @apiRoute GET /api/v1/finance/fees/trend */
export async function fetchFeeTrend(): Promise<FeeTrendData[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...feeTrendData]
    },
    async () => {
      const { data } = await apiClient.get<FeeTrendData[]>('/finance/fees/trend')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/finance/fees/progress */
export async function fetchFeeProgress(): Promise<FeeProgressData[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return [...feeProgressData]
    },
    async () => {
      const { data } = await apiClient.get<FeeProgressData[]>('/finance/fees/progress')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/finance/fees */
export async function fetchFeeCollection(): Promise<FeeCollectionRecord[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      return feeCollectionData.map(r => ({ ...r }))
    },
    async () => {
      const { data } = await apiClient.get<FeeCollectionRecord[]>('/finance/fees')
      return data
    },
  )
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Mark a fee as paid — creates a matching PaymentTransaction.
 *
 * @apiRoute POST /api/v1/finance/fees/mark-paid
 */
export async function markAsPaid(params: {
  studentId: string
  feeCategory: FeeCategory
  amount: number
  method: PaymentMethod
  transactionId: string
  paidDate: string
  notes?: string
}): Promise<PaymentTransaction> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 350, max: 600 })
      const record = findFeeRecord(params.studentId, params.feeCategory)
      if (!record) throw new Error('Fee record not found')
      const transactionId = params.transactionId || txnId(paymentTransactions.length + 1)
      const receiptId = newId('REC')
      const paidDate = params.paidDate
      record.status = 'Paid'
      record.paidAmount = params.amount
      record.paidDate = paidDate
      record.paymentMethod = params.method
      record.transactionId = transactionId
      record.receiptId = receiptId
      const transaction: PaymentTransaction = {
        id: transactionId,
        studentId: params.studentId,
        studentName: record.studentName,
        class: record.class,
        feeCategory: record.feeCategory,
        amount: params.amount,
        method: params.method,
        status: 'success',
        transactionId,
        paidDate,
        receiptId,
      }
      paymentTransactions.push(transaction)
      return { ...transaction }
    },
    async () => {
      const { data } = await apiClient.post<PaymentTransaction>(
        '/finance/fees/mark-paid',
        params,
      )
      return data
    },
  )
}

/**
 * Payment history, optionally filtered by student.
 *
 * @apiRoute GET /api/v1/finance/payments?studentId={studentId}
 */
export async function fetchPaymentHistory(studentId?: string): Promise<PaymentTransaction[]> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const filtered = studentId
        ? paymentTransactions.filter(t => t.studentId === studentId)
        : paymentTransactions
      return filtered.map(t => ({ ...t }))
    },
    async () => {
      const { data } = await apiClient.get<PaymentTransaction[]>('/finance/payments', {
        params: studentId ? { studentId } : undefined,
      })
      return data
    },
  )
}

/**
 * Generate a printable receipt for a transaction.
 *
 * @apiRoute GET /api/v1/finance/receipts?transactionId={transactionId}
 */
export async function generateReceipt(
  transactionId: string,
  schoolName: string,
): Promise<Receipt | null> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 450 })
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
    },
    async () => {
      try {
        const { data } = await apiClient.get<Receipt>('/finance/receipts', {
          params: { transactionId, schoolName },
        })
        return data
      } catch (err: any) {
        if (err?.status === 404) return null
        throw err
      }
    },
  )
}
