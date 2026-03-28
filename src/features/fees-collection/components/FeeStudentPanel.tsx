/**
 * FeeStudentPanel — Side panel showing all fee records for a student.
 *
 * Sections: Student header, fee summary cards, fee records list with
 * Pay buttons, payment history, and quick actions.
 */

import * as React from 'react'
import { CreditCard, Receipt, Download, CheckCircle, Loader2, Clock } from 'lucide-react'
import { text, border, accent, background, baseColors, status as statusColors, darken } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fetchPaymentHistory, processPayment } from '@/api/services/fees-collection-service'
import { PAYMENT_METHOD_LABELS } from '../types'
import type { FeeCollectionRecord, FeeStatus, PaymentTransaction, PaymentMethod, FeeCategory } from '../types'

// ============================================================================
// Status badge styles (shared with columns)
// ============================================================================

const STATUS_STYLES: Record<FeeStatus, { color: string; bg: string; border?: string }> = {
  Paid: { color: background.card, bg: statusColors.success.base },
  Pending: { color: baseColors.heading, bg: baseColors.pink, border: darken(baseColors.pink, 20) },
  'Partially Paid': { color: baseColors.heading, bg: baseColors.blue, border: darken(baseColors.blue, 15) },
  Overdue: { color: background.card, bg: statusColors.danger.base },
}

// ============================================================================
// Component
// ============================================================================

interface FeeStudentPanelProps {
  studentId: string | null
  allRecords: FeeCollectionRecord[]
  onDataChanged: () => void
}

export function FeeStudentPanel({ studentId, allRecords, onDataChanged }: FeeStudentPanelProps) {
  // Filter records for this student
  const studentRecords = React.useMemo(
    () => allRecords.filter(r => r.studentId === studentId),
    [allRecords, studentId],
  )

  const student = studentRecords[0]

  // Payment history
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)

  // Payment processing state
  const [payingCategory, setPayingCategory] = React.useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('online')

  const loadHistory = React.useCallback(async () => {
    if (!studentId) return
    setIsLoadingHistory(true)
    try {
      const data = await fetchPaymentHistory(studentId)
      setTransactions(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [studentId])

  React.useEffect(() => { loadHistory() }, [loadHistory])

  // Computed summaries
  const totalDue = studentRecords.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalPaid = studentRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.totalAmount, 0)
  const totalPending = totalDue - totalPaid

  // Pay handler
  const handlePay = React.useCallback(async (record: FeeCollectionRecord) => {
    setPayingCategory(record.feeCategory)
    try {
      await processPayment({
        studentId: record.studentId,
        feeCategory: record.feeCategory as FeeCategory,
        amount: record.totalAmount,
        method: paymentMethod,
      })
      onDataChanged()
      await loadHistory()
    } catch (err) {
      console.error('Payment failed:', err)
    } finally {
      setPayingCategory(null)
    }
  }, [paymentMethod, onDataChanged, loadHistory])

  if (!student || !studentId) {
    return (
      <div style={{ padding: spacing['6'], paddingTop: '48px' }}>
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-text-muted">Select a student to view details</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: spacing['6'], paddingTop: '48px', overflow: 'auto', height: '100%' }}>

      {/* ═══ STUDENT HEADER ═══ */}
      <div style={{ marginBottom: spacing['6'] }}>
        <div className="flex items-center gap-3">
          <div
            className="rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{ width: '40px', height: '40px', minWidth: '40px', backgroundColor: accent.base, color: text.heading }}
          >
            {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: text.heading, margin: 0 }}>
              {student.studentName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: accent.base, color: text.heading }}
              >
                {student.studentId}
              </span>
              <span style={{ fontSize: '12px', color: text.muted }}>Class {student.class}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SUMMARY CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing['3'], marginBottom: spacing['6'] }}>
        {[
          { label: 'Total Due', value: totalDue, color: text.heading },
          { label: 'Paid', value: totalPaid, color: statusColors.success.base },
          { label: 'Pending', value: totalPending, color: totalPending > 0 ? statusColors.danger.base : text.muted },
        ].map(card => (
          <div
            key={card.label}
            style={{
              padding: spacing['3'],
              borderRadius: '10px',
              backgroundColor: accent.base,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>{card.label}</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: card.color }}>
              ₹{card.value.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>

      {/* ═══ FEE RECORDS ═══ */}
      <div style={{ marginBottom: spacing['6'] }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: text.heading, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: spacing['3'] }}>
          Fee Records
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
          {studentRecords.map(record => {
            const statusStyle = STATUS_STYLES[record.status]
            const isPaying = payingCategory === record.feeCategory
            const canPay = record.status !== 'Paid'

            return (
              <div
                key={record.feeCategory}
                className="rounded-lg border"
                style={{ padding: spacing['3'], borderColor: border.default, backgroundColor: background.card }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>
                    {record.feeCategory}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: text.heading }}>
                    ₹{record.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '11px', color: text.muted }}>Due: {record.dueDate}</span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-px text-[10px] font-medium"
                      style={{
                        color: statusStyle.color,
                        backgroundColor: statusStyle.bg,
                        ...(statusStyle.border ? { border: `1px solid ${statusStyle.border}` } : {}),
                      }}
                    >
                      {record.status}
                    </span>
                    {record.paymentMethod && (
                      <span style={{ fontSize: '10px', color: text.muted }}>
                        via {PAYMENT_METHOD_LABELS[record.paymentMethod]}
                      </span>
                    )}
                  </div>
                  {canPay && (
                    <button
                      type="button"
                      onClick={() => handlePay(record)}
                      disabled={isPaying}
                      className="flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1 cursor-pointer transition-opacity"
                      style={{
                        backgroundColor: text.heading,
                        color: background.card,
                        opacity: isPaying ? 0.6 : 1,
                      }}
                    >
                      {isPaying ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Paying...</>
                      ) : (
                        <><CreditCard className="w-3 h-3" /> Pay</>
                      )}
                    </button>
                  )}
                  {!canPay && record.transactionId && (
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: statusColors.success.base }}>
                      <CheckCircle className="w-3 h-3" />
                      {record.transactionId}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ PAYMENT METHOD SELECTOR ═══ */}
      {studentRecords.some(r => r.status !== 'Paid') && (
        <div style={{ marginBottom: spacing['6'] }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: text.heading, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: spacing['3'] }}>
            Payment Method
          </h3>
          <div style={{ display: 'flex', gap: spacing['2'], flexWrap: 'wrap' }}>
            {(['online', 'cash', 'cheque', 'bank_transfer'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className="text-[11px] font-medium rounded-full px-3 py-1.5 cursor-pointer transition-all"
                style={{
                  border: `2px solid ${paymentMethod === m ? text.heading : border.default}`,
                  backgroundColor: paymentMethod === m ? accent.base : background.surface,
                  color: text.heading,
                }}
              >
                {PAYMENT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ PAYMENT HISTORY ═══ */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: text.heading, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: spacing['3'] }}>
          Payment History
        </h3>
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-text-muted">Loading history...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Clock className="w-6 h-6" style={{ color: text.muted }} />
            <span className="text-xs text-text-muted">No payment history yet</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
            {transactions.map(txn => (
              <div
                key={txn.id}
                className="rounded-lg border"
                style={{ padding: `${spacing['2.5']} ${spacing['3']}`, borderColor: border.default }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: text.heading }}>
                    {txn.feeCategory}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: text.heading }}>
                    ₹{txn.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '10px', color: text.muted }}>{txn.paidDate}</span>
                  <span
                    className="text-[9px] font-medium rounded-full px-1.5 py-px"
                    style={{ backgroundColor: accent.base, color: text.heading }}
                  >
                    {PAYMENT_METHOD_LABELS[txn.method]}
                  </span>
                  <span
                    className="text-[9px] font-medium rounded-full px-1.5 py-px"
                    style={{ backgroundColor: statusColors.success.base, color: '#fff' }}
                  >
                    {txn.status}
                  </span>
                  <span style={{ fontSize: '9px', color: text.muted, marginLeft: 'auto' }}>
                    {txn.receiptId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
