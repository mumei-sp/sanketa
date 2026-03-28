/**
 * PaymentDialog — 3-step payment processing dialog.
 *
 * Step 1: Form — select payment method
 * Step 2: Processing — spinner (mock delay)
 * Step 3: Success — transaction details + receipt link
 */

import * as React from 'react'
import { CheckCircle, Loader2, CreditCard, Banknote, FileText, Building2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { text, border, accent, background, baseColors, status } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { processPayment } from '@/api/services/fees-collection-service'
import type { FeeCollectionRecord, PaymentMethod, PaymentGateway, PaymentTransaction, FeeCategory } from '../types'
import { PAYMENT_METHOD_LABELS, PAYMENT_GATEWAY_LABELS } from '../types'

type Step = 'form' | 'processing' | 'success'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: FeeCollectionRecord | null
  onPaymentComplete: (transaction: PaymentTransaction) => void
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'online', label: 'Online', icon: CreditCard },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'cheque', label: 'Cheque', icon: FileText },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
]

const GATEWAY_OPTIONS: { value: PaymentGateway; label: string }[] = [
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'paytm', label: 'Paytm' },
]

export function PaymentDialog({ open, onOpenChange, record, onPaymentComplete }: PaymentDialogProps) {
  const [step, setStep] = React.useState<Step>('form')
  const [method, setMethod] = React.useState<PaymentMethod>('online')
  const [gateway, setGateway] = React.useState<PaymentGateway>('razorpay')
  const [transaction, setTransaction] = React.useState<PaymentTransaction | null>(null)

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep('form')
      setMethod('online')
      setGateway('razorpay')
      setTransaction(null)
    }
  }, [open])

  const handleProcess = React.useCallback(async () => {
    if (!record) return
    setStep('processing')
    try {
      const txn = await processPayment({
        studentId: record.studentId,
        feeCategory: record.feeCategory as FeeCategory,
        amount: record.totalAmount,
        method,
        gateway: method === 'online' ? gateway : undefined,
      })
      setTransaction(txn)
      setStep('success')
    } catch (err) {
      console.error('Payment failed:', err)
      setStep('form')
    }
  }, [record, method, gateway])

  const handleDone = React.useCallback(() => {
    if (transaction) onPaymentComplete(transaction)
    onOpenChange(false)
  }, [transaction, onPaymentComplete, onOpenChange])

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={step === 'processing' ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle style={{ color: text.heading }}>
            {step === 'success' ? 'Payment Successful' : 'Process Payment'}
          </DialogTitle>
        </DialogHeader>

        {/* ═══ FORM STEP ═══ */}
        {step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            {/* Student + fee info */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 16px',
                padding: '10px 14px',
                backgroundColor: accent.base,
                borderRadius: '8px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: text.muted, display: 'block' }}>Student</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>{record.studentName}</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: text.muted, display: 'block' }}>Class</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>{record.class}</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: text.muted, display: 'block' }}>Fee Category</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>{record.feeCategory}</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: text.muted, display: 'block' }}>Amount</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: text.heading }}>₹{record.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: text.heading, display: 'block', marginBottom: spacing['2'] }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['2'] }}>
                {METHOD_OPTIONS.map(opt => {
                  const isSelected = method === opt.value
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMethod(opt.value)}
                      className="flex items-center gap-2 rounded-lg cursor-pointer transition-all text-left"
                      style={{
                        padding: `${spacing['2.5']} ${spacing['3']}`,
                        border: `2px solid ${isSelected ? text.heading : border.default}`,
                        backgroundColor: isSelected ? accent.base : background.surface,
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: text.heading }} />
                      <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: text.heading }}>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Gateway selector (online only) */}
            {method === 'online' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: text.heading, display: 'block', marginBottom: spacing['2'] }}>
                  Payment Gateway
                </label>
                <div style={{ display: 'flex', gap: spacing['2'] }}>
                  {GATEWAY_OPTIONS.map(opt => {
                    const isSelected = gateway === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGateway(opt.value)}
                        className="flex-1 rounded-lg cursor-pointer transition-all text-center"
                        style={{
                          padding: `${spacing['2']} ${spacing['3']}`,
                          border: `2px solid ${isSelected ? text.heading : border.default}`,
                          backgroundColor: isSelected ? accent.base : background.surface,
                          fontSize: '12px',
                          fontWeight: isSelected ? 600 : 400,
                          color: text.heading,
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PROCESSING STEP ═══ */}
        {step === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing['3'], padding: spacing['8'] }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: text.heading }} />
            <p style={{ fontSize: '14px', color: text.muted }}>Processing payment...</p>
            <p style={{ fontSize: '11px', color: text.muted }}>
              {method === 'online' ? `Via ${PAYMENT_GATEWAY_LABELS[gateway]}` : PAYMENT_METHOD_LABELS[method]}
            </p>
          </div>
        )}

        {/* ═══ SUCCESS STEP ═══ */}
        {step === 'success' && transaction && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing['3'], padding: spacing['4'] }}>
            <div
              className="rounded-full flex items-center justify-center"
              style={{ width: '48px', height: '48px', backgroundColor: status.success.base }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: '#fff' }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: text.heading }}>Payment Successful</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['1'], alignItems: 'center' }}>
              <p style={{ fontSize: '12px', color: text.muted }}>
                Transaction: <strong style={{ color: text.heading }}>{transaction.transactionId}</strong>
              </p>
              <p style={{ fontSize: '12px', color: text.muted }}>
                Receipt: <strong style={{ color: text.heading }}>{transaction.receiptId}</strong>
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: text.heading, marginTop: spacing['2'] }}>
                ₹{transaction.amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <DialogFooter className="flex-row items-center justify-end gap-2">
          {step === 'form' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={handleProcess}
                style={{ backgroundColor: text.heading, color: background.card }}
              >
                Process Payment
              </Button>
            </>
          )}
          {step === 'success' && (
            <Button
              onClick={handleDone}
              style={{ backgroundColor: text.heading, color: background.card }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
