/**
 * FeeStudentPanel — Polished side panel showing all fee records for a student.
 *
 * Sections: Student header, summary stats, fee records with "Mark as Paid",
 * and payment history. Styled to match FeeStatCards and StudentProfileCard quality.
 */

import * as React from 'react'
import { CheckCircle, Clock, IndianRupee, AlertTriangle, CircleDashed } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { text, border, accent, background, baseColors, status as statusColors, darken } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fetchPaymentHistory } from '@/api/services/fees-collection-service'
import { PaymentDialog } from './PaymentDialog'
import { PAYMENT_METHOD_LABELS } from '../types'
import type { FeeCollectionRecord, FeeStatus, PaymentTransaction, PaymentMethod } from '../types'

// ============================================================================
// Status styles (shared with columns)
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
  const totalPending = totalDue - totalPaid

  const handleMarkComplete = React.useCallback(() => {
    onDataChanged()
    loadHistory()
  }, [onDataChanged, loadHistory])

  if (!student || !studentId) {
    return (
      <div style={{ padding: spacing['6'], paddingTop: '56px' }}>
        <div className="flex items-center justify-center py-16">
          <span className="text-sm" style={{ color: text.muted }}>Select a student to view details</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: `0 ${spacing['6']} ${spacing['6']}`, paddingTop: '56px', overflow: 'auto', height: '100%' }}>

      {/* ═══ STUDENT HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: spacing['6'] }}>
        <div
          className="rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
          style={{
            width: '48px', height: '48px', minWidth: '48px',
            backgroundColor: baseColors.heading, color: '#FFFFFF',
          }}
        >
          {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: text.heading, margin: 0, lineHeight: 1.3 }}>
            {student.studentName}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: accent.base, color: text.heading }}
            >
              {student.studentId}
            </span>
            <span style={{ fontSize: '12px', color: text.muted }}>Class {student.class}</span>
          </div>
        </div>
      </div>

      {/* ═══ SUMMARY STATS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing['3'], marginBottom: spacing['6'] }}>
        {[
          { label: 'Total Due', value: totalDue, icon: IndianRupee, iconBg: baseColors.heading, iconColor: '#FFFFFF' },
          { label: 'Paid', value: totalPaid, icon: CheckCircle, iconBg: statusColors.success.base, iconColor: '#FFFFFF' },
          { label: 'Pending', value: totalPending, icon: totalPending > 0 ? AlertTriangle : CircleDashed, iconBg: totalPending > 0 ? baseColors.pink : border.default, iconColor: totalPending > 0 ? baseColors.heading : text.muted },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex flex-col items-center gap-2 py-3 px-2">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: '36px', height: '36px', backgroundColor: stat.iconBg }}
              >
                <Icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
              <div className="text-center">
                <span
                  className="text-[17px] font-extrabold leading-tight tracking-tight block"
                  style={{ color: baseColors.heading }}
                >
                  ₹{stat.value.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-medium" style={{ color: text.muted }}>
                  {stat.label}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ═══ FEE RECORDS ═══ */}
      <div style={{ marginBottom: spacing['6'] }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: text.muted, marginBottom: spacing['3'] }}>
          Fee Breakdown
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
          {studentRecords.map(record => {
            const statusStyle = STATUS_STYLES[record.status]
            const isPaid = record.status === 'Paid'

            return (
              <Card key={record.feeCategory} className="px-4 py-3">
                {/* Top row: category + amount */}
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>
                    {record.feeCategory}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: text.heading }}>
                    ₹{record.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Bottom row: date + status + action/info */}
                <div className="flex items-center justify-between mt-2">
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
                  </div>

                  {isPaid ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3" style={{ color: statusColors.success.base }} />
                      <span style={{ fontSize: '10px', color: text.muted }}>
                        {record.paymentMethod ? PAYMENT_METHOD_LABELS[record.paymentMethod] : ''} · {record.transactionId}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMarkingRecord(record)}
                      className="text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-70"
                      style={{ color: text.heading, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* ═══ PAYMENT HISTORY ═══ */}
      <div style={{ marginTop: spacing['6'] }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: text.muted, marginBottom: spacing['3'] }}>
          Payment History
        </p>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs" style={{ color: text.muted }}>Loading...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-1.5">
            <Clock className="w-5 h-5" style={{ color: border.default }} />
            <span className="text-xs" style={{ color: text.muted }}>No payments recorded yet</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['1.5'] }}>
            {transactions.map(txn => (
              <div
                key={txn.id}
                className="flex items-center gap-3"
                style={{ padding: `${spacing['2']} 0` }}
              >
                {/* Dot */}
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: '8px', height: '8px', backgroundColor: statusColors.success.base }}
                />
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '12px', fontWeight: 600, color: text.heading }}>
                      {txn.feeCategory}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: text.heading }}>
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ fontSize: '10px', color: text.muted }}>{txn.paidDate}</span>
                    <span
                      className="text-[9px] font-medium rounded-full px-1.5 py-px"
                      style={{ backgroundColor: accent.base, color: text.heading }}
                    >
                      {PAYMENT_METHOD_LABELS[txn.method]}
                    </span>
                    <span style={{ fontSize: '9px', color: text.muted }}>{txn.receiptId}</span>
                  </div>
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
