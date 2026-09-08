/**
 * FeeStudentPanel — Stripe-style invoice panel for student fee management.
 *
 * Minimal, whitespace-heavy, text-driven. No card borders, no icon boxes.
 * Large hero amount, line items with dot leaders, timeline for history.
 */

import * as React from 'react'
import { Check, Clock, Send } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { text, border, background, status as statusColors, withOpacity, statusVivid } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fetchPaymentHistory } from '@/api/services/fees-collection-service'
import { PaymentFormSheet } from './PaymentFormSheet'
import { usePermissions } from '@/features/auth/PermissionContext'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
  fetchPaymentReminders,
  sendPaymentReminder,
  type PaymentReminder,
} from '@/api/services/fees-collection-service'
import { formatRelativeTime } from '@/features/notifications/utils/notification-display'
import { PAYMENT_METHOD_LABELS } from '../types'
import { toast } from 'sonner'
import type { FeeCollectionRecord, FeeStatus, PaymentTransaction } from '../types'

// ============================================================================
// Status config
// ============================================================================

const STATUS_CONFIG: Record<FeeStatus, { label: string; color: string; bg: string; border?: string }> = {
  Paid:             { label: 'Paid',    bg: statusVivid.success.bg, color: statusVivid.success.color },
  Pending:          { label: 'Pending', bg: statusVivid.warning.bg, color: statusVivid.warning.color },
  'Partially Paid': { label: 'Partial', bg: statusVivid.info.bg,    color: statusVivid.info.color    },
  Overdue:          { label: 'Overdue', bg: statusVivid.danger.bg,  color: statusVivid.danger.color  },
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
  // `finance.view` gets you this panel; recording money against it is the
  // other half. Not scoped — fees are the school's ledger, not a class's.
  const { can } = usePermissions()
  const canManage = can('finance.manage')
  const currentUser = useCurrentUser()

  /** Reminders already sent to this guardian — the evidence the button owes. */
  const [reminders, setReminders] = React.useState<PaymentReminder[]>([])
  const [isReminding, setIsReminding] = React.useState(false)

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

  React.useEffect(() => {
    if (!studentId) {
      setReminders([])
      return
    }
    let cancelled = false
    fetchPaymentReminders(studentId)
      .then(rows => { if (!cancelled) setReminders(rows) })
      .catch(error => console.error('Failed to load reminder history', error))
    return () => { cancelled = true }
  }, [studentId])

  /**
   * Remind the guardian, and keep the receipt.
   *
   * This used to be a toast claiming an SMS and an email had gone out, with
   * nothing behind it. Nothing is actually sent now either — there is no
   * gateway — but the intent is recorded and shown back, so the panel stops
   * asserting something it cannot know.
   */
  const remind = async () => {
    if (!student || !studentId) return
    setIsReminding(true)
    try {
      await sendPaymentReminder({
        studentId,
        studentName: student.studentName,
        amount: pendingAmount,
        sentBy: currentUser?.fullName ?? 'Someone',
      })
      setReminders(await fetchPaymentReminders(studentId))
      toast.success(`Reminder logged for ${student.studentName}'s guardian`, {
        description: `₹${pendingAmount.toLocaleString('en-IN')} outstanding. Delivery is not wired up yet — the request is recorded.`,
      })
    } catch (error) {
      console.error('Failed to record a reminder', error)
      toast.error('Could not record that reminder')
    } finally {
      setIsReminding(false)
    }
  }

  // Computed
  const totalDue = studentRecords.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalPaid = studentRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.totalAmount, 0)
  const pendingAmount = totalDue - totalPaid
  const paidCount = studentRecords.filter(r => r.status === 'Paid').length
  const allPaid = paidCount === studentRecords.length
  const paidPercent = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0

  const handleMarkComplete = React.useCallback((txn: PaymentTransaction) => {
    toast.success(`Payment recorded for ${txn.feeCategory}`)
    onDataChanged()
    loadHistory()
  }, [onDataChanged, loadHistory])

  if (!student || !studentId) {
    return (
      <div style={{ paddingTop: '56px', paddingLeft: spacing['8'], paddingRight: spacing['8'], paddingBottom: spacing['8'] }}>
        <div className="flex items-center justify-center py-20">
          <span style={{ fontSize: '13px', color: text.muted }}>Select a student to view details</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '56px', paddingLeft: 0, paddingRight: 0, paddingBottom: 0, overflow: 'auto', height: '100%' }}>

      {/* ═══ HERO SECTION ═══ */}
      <div style={{ paddingLeft: spacing['8'], paddingRight: spacing['8'], paddingTop: 0, paddingBottom: spacing['6'] }}>
        {/* Student identity */}
        <div style={{ marginBottom: spacing['6'] }}>
          <p style={{ fontSize: '12px', color: text.muted, marginBottom: '3px', letterSpacing: '0.02em' }}>
            {student.studentId} · Class {student.class}
          </p>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: text.heading, margin: 0, letterSpacing: '-0.01em' }}>
            {student.studentName}
          </h2>
        </div>

        {/* Amount hero */}
        <div className="flex items-end justify-between" style={{ marginBottom: spacing['3'] }}>
          <div>
            <span style={{ fontSize: '32px', fontWeight: 800, color: text.heading, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              ₹{totalDue.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: '11px', color: text.muted, marginTop: '4px' }}>
              Total due · {studentRecords.length} items
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: allPaid ? statusColors.success.base : withOpacity('var(--accent)', 0.5),
                color: allPaid ? '#fff' : 'var(--heading)',
              }}
            >
              {allPaid ? 'Fully Paid' : `₹${totalPaid.toLocaleString('en-IN')} paid`}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '4px', backgroundColor: border.subtle, borderRadius: '2px' }}>
          <div
            style={{
              height: '100%',
              width: `${paidPercent}%`,
              backgroundColor: allPaid ? statusColors.success.base : 'var(--heading)',
              borderRadius: '2px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: '6px' }}>
          <span style={{ fontSize: '10px', color: text.muted }}>
            {paidPercent}% collected
          </span>
          <span style={{ fontSize: '10px', color: text.muted }}>
            {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString('en-IN')} pending` : 'All clear'}
          </span>
        </div>

        {/* Send Reminder — only when pending */}
        {canManage && pendingAmount > 0 && (
          <button
            type="button"
            disabled={isReminding}
            onClick={() => void remind()}
            className="flex items-center gap-1.5 mt-4 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: text.heading, textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: withOpacity('var(--heading)', 0.3) }}
          >
            <Send className="w-3 h-3" />
            {isReminding ? 'Recording…' : 'Send Payment Reminder'}
          </button>
        )}

        {/* The history the old button never left behind. Whoever opens this
            panel next can see whether the guardian has been chased once or
            five times, which is the whole point of recording it. */}
        {reminders.length > 0 && (
          <p style={{ fontSize: '10px', color: text.muted, marginTop: '6px' }}>
            {reminders.length === 1 ? 'Reminded' : `${reminders.length} reminders, last`}{' '}
            {formatRelativeTime(reminders[0].sentAt)} by {reminders[0].sentBy}
          </p>
        )}
      </div>

      <div style={{ marginLeft: spacing['8'], marginRight: spacing['8'] }}><Separator /></div>

      {/* ═══ LINE ITEMS ═══ */}
      <div style={{ paddingTop: spacing['5'], paddingBottom: spacing['5'], paddingLeft: spacing['8'], paddingRight: spacing['8'] }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: text.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing['3'] }}>
          Fee Breakdown
        </p>

        {studentRecords.map((record, idx) => {
          const isPaid = record.status === 'Paid'
          const sc = STATUS_CONFIG[record.status]

          return (
            <div key={record.feeCategory}>
              <div
                className="flex items-start justify-between"
                style={{ paddingTop: spacing['3'], paddingBottom: spacing['3'] }}
              >
                {/* Left: category + details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '13px', fontWeight: 500, color: text.heading }}>
                      {record.feeCategory}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-px text-[10px] font-medium leading-tight"
                      style={{
                        color: sc.color,
                        backgroundColor: sc.bg,
                        ...(sc.border ? { border: `1px solid ${sc.border}` } : {}),
                      }}
                    >
                      {sc.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: text.muted, marginTop: '3px', lineHeight: 1.4 }}>
                    Due {record.dueDate}
                    {isPaid && record.paymentMethod && (
                      <>
                        <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                        {PAYMENT_METHOD_LABELS[record.paymentMethod]}
                        <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', letterSpacing: '0.02em' }}>{record.transactionId}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Right: amount + action */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: spacing['4'] }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{record.totalAmount.toLocaleString('en-IN')}
                  </span>
                  {isPaid ? (
                    <div className="flex items-center justify-end gap-1" style={{ marginTop: '3px' }}>
                      <Check className="w-3 h-3" style={{ color: statusColors.success.base }} />
                      <span style={{ fontSize: '10px', color: statusColors.success.base, fontWeight: 500 }}>Paid</span>
                    </div>
                  ) : canManage ? (
                    <button
                      type="button"
                      onClick={() => setMarkingRecord(record)}
                      className="cursor-pointer block transition-opacity hover:opacity-70"
                      style={{ fontSize: '11px', fontWeight: 600, color: 'var(--heading)', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: withOpacity('var(--heading)', 0.3), marginTop: '3px' }}
                    >
                      Mark as Paid
                    </button>
                  ) : (
                    <span
                      style={{ fontSize: '10px', color: text.muted, display: 'block', marginTop: '3px' }}
                    >
                      Unpaid
                    </span>
                  )}
                </div>
              </div>

              {idx < studentRecords.length - 1 && (
                <div style={{ borderBottom: `1px solid ${border.subtle}` }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginLeft: spacing['8'], marginRight: spacing['8'] }}><Separator /></div>

      {/* ═══ PAYMENT HISTORY ═══ */}
      <div style={{ paddingTop: spacing['5'], paddingBottom: spacing['8'], paddingLeft: spacing['8'], paddingRight: spacing['8'] }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: text.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing['4'] }}>
          Payment History
        </p>

        {isLoadingHistory ? (
          <p style={{ fontSize: '12px', color: text.muted, paddingTop: spacing['4'], paddingBottom: spacing['4'] }}>Loading...</p>
        ) : transactions.length === 0 ? (
          <div className="flex items-center gap-2" style={{ paddingTop: spacing['4'], paddingBottom: spacing['4'] }}>
            <Clock className="w-3.5 h-3.5" style={{ color: border.default }} />
            <span style={{ fontSize: '12px', color: text.muted }}>No payments recorded yet</span>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '22px' }}>
            {/* Timeline line */}
            <div
              style={{
                position: 'absolute',
                left: '5px',
                top: '8px',
                bottom: '8px',
                width: '1px',
                backgroundColor: border.default,
              }}
            />

            {transactions.map((txn, idx) => (
              <div
                key={txn.id}
                className="relative"
                style={{ paddingBottom: idx < transactions.length - 1 ? spacing['5'] : 0 }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-22px',
                    top: '6px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: statusColors.success.base,
                    border: `2px solid ${background.card}`,
                    boxShadow: `0 0 0 1px ${statusColors.success.base}`,
                  }}
                />

                {/* Content */}
                <div className="flex items-start justify-between">
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: text.heading }}>
                      {txn.feeCategory}
                    </span>
                    <p style={{ fontSize: '11px', color: text.muted, marginTop: '2px', lineHeight: 1.4 }}>
                      {txn.paidDate}
                      <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                      {PAYMENT_METHOD_LABELS[txn.method]}
                      <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px' }}>{txn.receiptId}</span>
                    </p>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{txn.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MARK AS PAID DIALOG ═══ */}
      <PaymentFormSheet
        open={markingRecord !== null}
        onOpenChange={open => { if (!open) setMarkingRecord(null) }}
        record={markingRecord}
        onComplete={handleMarkComplete}
      />
    </div>
  )
}
