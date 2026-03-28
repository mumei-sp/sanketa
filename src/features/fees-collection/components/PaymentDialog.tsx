/**
 * PaymentDialog — "Mark as Paid" form for admin fee management.
 *
 * Simple form: select method, enter transaction ID, date, notes → mark paid.
 * No payment gateway simulation.
 */

import * as React from 'react'
import { CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { text, border, accent, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { markAsPaid } from '@/api/services/fees-collection-service'
import type { FeeCollectionRecord, PaymentMethod, PaymentTransaction, FeeCategory } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: FeeCollectionRecord | null
  onComplete: (transaction: PaymentTransaction) => void
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function PaymentDialog({ open, onOpenChange, record, onComplete }: PaymentDialogProps) {
  const [method, setMethod] = React.useState<PaymentMethod>('cash')
  const [transactionId, setTransactionId] = React.useState('')
  const [paidDate, setPaidDate] = React.useState(getTodayStr())
  const [notes, setNotes] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setMethod('cash')
      setTransactionId('')
      setPaidDate(getTodayStr())
      setNotes('')
    }
  }, [open])

  const handleSubmit = React.useCallback(async () => {
    if (!record || !transactionId.trim()) return
    setIsSaving(true)
    try {
      const formattedDate = new Date(paidDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const txn = await markAsPaid({
        studentId: record.studentId,
        feeCategory: record.feeCategory as FeeCategory,
        amount: record.totalAmount,
        method,
        transactionId: transactionId.trim(),
        paidDate: formattedDate,
        notes: notes.trim() || undefined,
      })
      onComplete(txn)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to mark as paid:', err)
    } finally {
      setIsSaving(false)
    }
  }, [record, method, transactionId, paidDate, notes, onComplete, onOpenChange])

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={isSaving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle style={{ color: text.heading }}>Mark as Paid</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
          {/* Fee info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing['3']} ${spacing['4']}`,
              backgroundColor: accent.base,
              borderRadius: '10px',
            }}
          >
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>{record.feeCategory}</p>
              <p style={{ fontSize: '11px', color: text.muted }}>{record.studentName} · {record.class}</p>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: text.heading }}>
              ₹{record.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Payment method */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: text.heading, marginBottom: spacing['2'], display: 'block' }}>
              Payment Received Via
            </Label>
            <div style={{ display: 'flex', gap: spacing['1.5'], flexWrap: 'wrap' }}>
              {(['cash', 'cheque', 'bank_transfer', 'online'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className="text-xs font-medium rounded-full px-3 py-1.5 cursor-pointer transition-all"
                  style={{
                    border: `1.5px solid ${method === m ? text.heading : border.default}`,
                    backgroundColor: method === m ? accent.base : 'transparent',
                    color: text.heading,
                  }}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction / Reference ID */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: text.heading, marginBottom: spacing['1.5'], display: 'block' }}>
              Transaction / Reference ID
            </Label>
            <Input
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              placeholder="e.g., CHQ-4521 or TXN-20350315"
              className="text-sm"
              style={{ borderColor: border.default }}
            />
          </div>

          {/* Date received */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: text.heading, marginBottom: spacing['1.5'], display: 'block' }}>
              Date Received
            </Label>
            <input
              type="date"
              value={paidDate}
              onChange={e => setPaidDate(e.target.value)}
              className="w-full text-sm rounded-md border px-3 py-2 outline-none"
              style={{ borderColor: border.default, color: text.heading, backgroundColor: background.card }}
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: text.heading, marginBottom: spacing['1.5'], display: 'block' }}>
              Notes <span style={{ fontWeight: 400, color: text.muted }}>(optional)</span>
            </Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="text-sm"
              style={{ borderColor: border.default }}
            />
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!transactionId.trim() || isSaving}
            className="gap-1.5"
            style={{ backgroundColor: text.heading, color: background.card }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Mark as Paid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
