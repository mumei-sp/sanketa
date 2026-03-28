/**
 * FeeStudentPanel — Stripe-style invoice panel for student fee management.
 *
 * Minimal, whitespace-heavy, text-driven. No card borders, no icon boxes.
 * Large hero amount, line items with dot leaders, timeline for history.
 */

import * as React from 'react'
import { Check, Clock, Circle } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { text, border, accent, background, baseColors, status as statusColors, darken } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fetchPaymentHistory } from '@/api/services/fees-collection-service'
import { PaymentDialog } from './PaymentDialog'
import { PAYMENT_METHOD_LABELS } from '../types'
import type { FeeCollectionRecord, FeeStatus, PaymentTransaction } from '../types'

// ============================================================================
// Status config
// ============================================================================

const STATUS_CONFIG: Record<FeeStatus, { label: string; color: string; bg: string; border?: string }> = {
  Paid: { label: 'Paid', color: background.card, bg: statusColors.success.base },
  Pending: { label: 'Pending', color: baseColors.heading, bg: baseColors.pink, border: darken(baseColors.pink, 20) },
  'Partially Paid': { label: 'Partial', color: baseColors.heading, bg: baseColors.blue, border: darken(baseColors.blue, 15) },
  Overdue: { label: 'Overdue', color: background.card, bg: statusColors.danger.base },
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
  const studentRecords = React.useMemo(
    () => allRecords.filter(r => r.studentId === studentId),
    [allRecords, studentId],
  )
  const student = studentRecords[0]

  // Payment history
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)

  // Mark as paid dialog
  const [markingRecord, setMarkingRecord] = React.useState<FeeCollectionRecord | null>(null)

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

  // Computed
  const totalDue = studentRecords.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalPaid = studentRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.totalAmount, 0)
  const paidCount = studentRecords.filter(r => r.status === 'Paid').length
  const allPaid = paidCount === studentRecords.length

  const handleMarkComplete = React.useCallback(() => {
    onDataChanged()
    loadHistory()
  }, [onDataChanged, loadHistory])

  if (!student || !studentId) {
    return (
      <div style={{ padding: spacing['8'], paddingTop: '56px' }}>
        <div className="flex items-center justify-center py-20">
          <span style={{ fontSize: '13px', color: text.muted }}>Select a student to view details</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '56px', paddingLeft: 0, paddingRight: 0, paddingBottom: 0, overflow: 'auto', height: '100%' }}>

      {/* ═══ HERO SECTION ═══ */}
      <div style={{ padding: `0 ${spacing['8']} ${spacing['6']}` }}>
        {/* Student identity */}
        <div style={{ marginBottom: spacing['8'] }}>
          <p style={{ fontSize: '13px', color: text.muted, marginBottom: '2px' }}>
            {student.studentId} · Class {student.class}
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: text.heading, margin: 0, letterSpacing: '-0.02em' }}>
            {student.studentName}
          </h2>
        </div>

        {/* Amount hero */}
        <div className="flex items-end justify-between" style={{ marginBottom: spacing['2'] }}>
          <div>
            <span style={{ fontSize: '36px', fontWeight: 800, color: text.heading, letterSpacing: '-0.03em', lineHeight: 1 }}>
              ₹{totalDue.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: '12px', color: text.muted, marginTop: '4px' }}>
              Total due · {studentRecords.length} items
            </p>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: allPaid ? statusColors.success.base : baseColors.blue,
              color: allPaid ? '#fff' : baseColors.heading,
              border: allPaid ? undefined : `1px solid ${darken(baseColors.blue, 15)}`,
            }}
          >
            {allPaid ? 'Fully Paid' : `₹${totalPaid.toLocaleString('en-IN')} paid`}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', backgroundColor: border.default, borderRadius: '2px', marginBottom: spacing['2'] }}>
          <div
            style={{
              height: '100%',
              width: `${totalDue > 0 ? (totalPaid / totalDue) * 100 : 0}%`,
              backgroundColor: statusColors.success.base,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p style={{ fontSize: '11px', color: text.muted, textAlign: 'right' }}>
          {paidCount}/{studentRecords.length} paid
        </p>
      </div>

      <div style={{ margin: `0 ${spacing['8']}` }}><Separator /></div>

      {/* ═══ LINE ITEMS ═══ */}
      <div style={{ padding: `${spacing['6']} ${spacing['8']}` }}>
        {studentRecords.map((record, idx) => {
          const isPaid = record.status === 'Paid'
          const sc = STATUS_CONFIG[record.status]

          return (
            <div key={record.feeCategory}>
              <div
                className="flex items-start justify-between"
                style={{ padding: `${spacing['3']} 0` }}
              >
                {/* Left: category + details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '14px', fontWeight: 500, color: text.heading }}>
                      {record.feeCategory}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-px text-[10px] font-medium"
                      style={{
                        color: sc.color,
                        backgroundColor: sc.bg,
                        ...(sc.border ? { border: `1px solid ${sc.border}` } : {}),
                      }}
                    >
                      {sc.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: text.muted, marginTop: '2px' }}>
                    Due {record.dueDate}
                    {isPaid && record.paymentMethod && (
                      <> · {PAYMENT_METHOD_LABELS[record.paymentMethod]} · {record.transactionId}</>
                    )}
                  </p>
                </div>

                {/* Right: amount + action */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: spacing['4'] }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: text.heading }}>
                    ₹{record.totalAmount.toLocaleString('en-IN')}
                  </span>
                  {isPaid ? (
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <Check className="w-3 h-3" style={{ color: statusColors.success.base }} />
                      <span style={{ fontSize: '10px', color: statusColors.success.base }}>Paid</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMarkingRecord(record)}
                      className="cursor-pointer mt-0.5 block"
                      style={{ fontSize: '11px', fontWeight: 600, color: text.heading, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>

              {/* Divider between items (not after last) */}
              {idx < studentRecords.length - 1 && (
                <div style={{ borderBottom: `1px solid ${border.subtle}` }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ margin: `0 ${spacing['8']}` }}><Separator /></div>

      {/* ═══ PAYMENT HISTORY ═══ */}
      <div style={{ padding: `${spacing['6']} ${spacing['8']} ${spacing['8']}` }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: spacing['4'] }}>
          Payment History
        </p>

        {isLoadingHistory ? (
          <p style={{ fontSize: '12px', color: text.muted, padding: `${spacing['4']} 0` }}>Loading...</p>
        ) : transactions.length === 0 ? (
          <div className="flex items-center gap-2" style={{ padding: `${spacing['4']} 0` }}>
            <Clock className="w-3.5 h-3.5" style={{ color: border.default }} />
            <span style={{ fontSize: '12px', color: text.muted }}>No payments recorded yet</span>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            {/* Timeline line */}
            <div
              style={{
                position: 'absolute',
                left: '5px',
                top: '6px',
                bottom: '6px',
                width: '1px',
                backgroundColor: border.default,
              }}
            />

            {transactions.map((txn, idx) => (
              <div
                key={txn.id}
                className="relative"
                style={{ paddingBottom: idx < transactions.length - 1 ? spacing['4'] : 0 }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '5px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: statusColors.success.base,
                    border: `2px solid ${background.card}`,
                  }}
                />

                {/* Content */}
                <div className="flex items-start justify-between">
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: text.heading }}>
                      {txn.feeCategory}
                    </span>
                    <p style={{ fontSize: '11px', color: text.muted, marginTop: '1px' }}>
                      {txn.paidDate} · {PAYMENT_METHOD_LABELS[txn.method]} · {txn.receiptId}
                    </p>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading, flexShrink: 0 }}>
                    ₹{txn.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MARK AS PAID DIALOG ═══ */}
      <PaymentDialog
        open={markingRecord !== null}
        onOpenChange={open => { if (!open) setMarkingRecord(null) }}
        record={markingRecord}
        onComplete={handleMarkComplete}
      />
    </div>
  )
}
