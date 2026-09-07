/**
 * PaymentHistorySheet — Per-student payment transaction history.
 *
 * Shows all payments for a student with summary cards and transaction list.
 */

import * as React from 'react'
import { Receipt, Clock } from 'lucide-react'
import { text, border, accent, background, status as statusColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fetchPaymentHistory } from '@/api/services/fees-collection-service'
import { PAYMENT_METHOD_LABELS } from '../types'
import type { PaymentTransaction } from '../types'

interface PaymentHistorySheetProps {
  studentId: string | null
  studentName: string
  onViewReceipt: (transaction: PaymentTransaction) => void
}

export function PaymentHistorySheet({ studentId, studentName, onViewReceipt }: PaymentHistorySheetProps) {
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!studentId) return
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await fetchPaymentHistory(studentId!)
        if (!cancelled) setTransactions(data)
      } catch (err) {
        console.error('Failed to load payment history:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [studentId])

  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0)

  if (isLoading) {
    return (
      <div style={{ padding: spacing['6'], paddingTop: '48px' }}>
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-text-muted">Loading payment history...</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: spacing['6'], paddingTop: '48px', overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: spacing['6'] }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: text.heading, margin: 0 }}>
          Payment History
        </h2>
        <p style={{ fontSize: '13px', color: text.muted, marginTop: '4px' }}>
          {studentName}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['3'], marginBottom: spacing['6'] }}>
        <div
          style={{
            padding: spacing['4'],
            borderRadius: '10px',
            backgroundColor: accent.base,
          }}
        >
          <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Total Paid</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: text.heading }}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </span>
        </div>
        <div
          style={{
            padding: spacing['4'],
            borderRadius: '10px',
            backgroundColor: accent.base,
          }}
        >
          <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Transactions</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: text.heading }}>
            {transactions.length}
          </span>
        </div>
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Clock className="size-8" style={{ color: text.muted }} />
          <span className="text-sm text-text-muted">No payment history yet.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
          {transactions.map(txn => (
            <div
              key={txn.id}
              className="rounded-lg border"
              style={{
                padding: spacing['3'],
                borderColor: border.default,
                backgroundColor: background.card,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>
                  {txn.feeCategory}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: text.heading }}>
                  ₹{txn.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '11px', color: text.muted }}>{txn.paidDate}</span>
                  <span
                    className="text-[10px] font-medium rounded-full px-2 py-px"
                    style={{ backgroundColor: accent.base, color: text.heading }}
                  >
                    {PAYMENT_METHOD_LABELS[txn.method]}
                  </span>
                  <span
                    className="text-[10px] font-medium rounded-full px-2 py-px"
                    style={{ backgroundColor: statusColors.success.base, color: '#fff' }}
                  >
                    {txn.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewReceipt(txn)}
                  className="flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                  style={{ color: text.heading }}
                >
                  <Receipt className="w-3 h-3" />
                  Receipt
                </button>
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: text.muted }}>
                  Txn: {txn.transactionId}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
