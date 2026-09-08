/**
 * Fees Collection API Service
 *
 * Mock path + HTTP path per endpoint. VITE_USE_MOCK_API picks which runs.
 */

import { CircleCheckBig, CircleDashed, OctagonAlert } from 'lucide-react'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { emitDomainEvent } from './notification-service'
import { withLatency, txnId, newId, CURRENCY } from '@/mocks/_shared'
import { visibleToCaller } from '@/mocks/_shared/caller'
import { studentsData } from '@/mocks/students/students'
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
import * as reminderServer from '@/mocks/reminders'
import type { PaymentReminder } from '@/mocks/reminders'
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
      const rows = feeCollectionData.map(r => ({ ...r }))
      // Fee rows key on the human code (`S-2101`), while a scope holds profile
      // ids — the two identifiers a student record carries. Translating here,
      // next to the data that uses the odd one, rather than teaching the scope
      // about a second key.
      return visibleToCaller(rows, 'read', 'Finance', row => {
        const student = studentsData.find(candidate => candidate.studentId === row.studentId)
        return student ? { studentId: String(student.id) } : undefined
      })
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
      emitDomainEvent({
        type: 'fees.payment_recorded',
        payload: {
          paymentId: transaction.id,
          studentName: transaction.studentName,
          amount: `${CURRENCY.symbol}${params.amount.toLocaleString('en-IN')}`,
          method: params.method,
        },
      })
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

// ---------------------------------------------------------------------------
// Payment reminders
// ---------------------------------------------------------------------------

export type { PaymentReminder }

/**
 * Reminders already sent to a guardian, newest first.
 *
 * @apiRoute GET /api/v1/finance/reminders?studentId={id}
 */
export async function fetchPaymentReminders(studentId?: string): Promise<PaymentReminder[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 60, max: 160 })
      return reminderServer.listReminders(studentId)
    },
    async () => {
      const { data } = await apiClient.get<PaymentReminder[]>('/finance/reminders', {
        params: { studentId },
      })
      return data
    },
  )
}

/**
 * Remind a guardian about an outstanding balance.
 *
 * The mock records the intent rather than sending anything — there is no
 * gateway behind it, and the honest version of this endpoint in a real system
 * would queue a message and record exactly this row either way. What matters
 * is that the claim on screen now refers to something that exists.
 *
 * @apiRoute POST /api/v1/finance/reminders
 */
export async function sendPaymentReminder(input: {
  studentId: string
  studentName: string
  amount: number
  sentBy: string
}): Promise<PaymentReminder> {
  return mockOrHttp(
    async () => {
      await withLatency()
      const reminder = reminderServer.recordReminder(input)
      emitDomainEvent({
        type: 'fees.reminder_sent',
        payload: {
          studentId: input.studentId,
          studentName: input.studentName,
          amount: input.amount,
        },
      })
      return reminder
    },
    async () => {
      const { data } = await apiClient.post<PaymentReminder>('/finance/reminders', input)
      return data
    },
  )
}
