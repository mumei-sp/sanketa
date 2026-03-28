/**
 * ReceiptPreview — Print-ready fee payment receipt.
 *
 * Uses inline styles for reliable print output.
 * Pattern: same as ReportCardPreview in grades feature.
 */

import { Printer, GraduationCap } from 'lucide-react'
import { text, border, accent, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { PAYMENT_METHOD_LABELS } from '../types'
import type { PaymentTransaction } from '../types'

interface ReceiptPreviewProps {
  transaction: PaymentTransaction
  onPrint: () => void
}

export function ReceiptPreview({ transaction, onPrint }: ReceiptPreviewProps) {
  const { config } = useSchoolConfig()

  const cellStyle: React.CSSProperties = {
    border: `1px solid ${border.default}`,
    padding: '8px 12px',
    fontSize: '13px',
    color: text.body,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        id="receipt-print-area"
        style={{
          flex: 1,
          padding: spacing['6'],
          paddingTop: '48px',
          backgroundColor: background.card,
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'auto',
        }}
      >
        {/* School Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: `2px solid ${text.heading}`, marginBottom: '20px' }}>
          {config.schoolLogo ? (
            <img src={config.schoolLogo} alt={config.schoolName} style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px' }} />
          ) : (
            <div style={{ width: '56px', height: '56px', minWidth: '56px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: border.subtle }}>
              <GraduationCap style={{ width: '28px', height: '28px', color: text.heading }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: text.heading, margin: 0 }}>{config.schoolName}</h1>
            <p style={{ fontSize: '12px', color: text.muted, margin: '2px 0 0' }}>Fee Payment Receipt</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: text.heading, margin: 0 }}>{transaction.receiptId}</p>
            <p style={{ fontSize: '11px', color: text.muted, margin: '2px 0 0' }}>{transaction.paidDate}</p>
          </div>
        </div>

        {/* Student Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 24px',
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: accent.base,
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Student Name', value: transaction.studentName },
            { label: 'Student ID', value: transaction.studentId },
            { label: 'Class', value: transaction.class },
            { label: 'Fee Category', value: transaction.feeCategory },
          ].map(item => (
            <div key={item.label}>
              <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: text.heading }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Payment Details Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ ...cellStyle, backgroundColor: accent.base, color: text.heading, fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
                Description
              </th>
              <th style={{ ...cellStyle, backgroundColor: accent.base, color: text.heading, fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellStyle }}>{transaction.feeCategory}</td>
              <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                ₹{transaction.amount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: accent.base }}>
              <td style={{ ...cellStyle, fontWeight: 700, color: text.heading }}>Total Paid</td>
              <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, color: text.heading, fontSize: '16px' }}>
                ₹{transaction.amount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 24px',
            marginBottom: '24px',
            padding: '12px 16px',
            border: `1px solid ${border.default}`,
            borderRadius: '8px',
          }}
        >
          {[
            { label: 'Payment Method', value: PAYMENT_METHOD_LABELS[transaction.method] },
            { label: 'Transaction ID', value: transaction.transactionId },
            { label: 'Payment Date', value: transaction.paidDate },
            { label: 'Status', value: 'Success' },
          ].map(item => (
            <div key={item.label}>
              <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: text.heading }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', color: text.muted, fontStyle: 'italic' }}>
            This is a computer-generated receipt and does not require a physical signature.
          </p>
        </div>

        {/* Signature line */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: `1px solid ${border.default}`, width: '180px', marginBottom: '4px' }} />
            <span style={{ fontSize: '11px', color: text.muted }}>Authorized Signatory</span>
          </div>
        </div>
      </div>

      {/* Print button */}
      <div
        className="no-print"
        style={{
          padding: `${spacing['3']} ${spacing['6']}`,
          borderTop: `1px solid ${border.default}`,
          backgroundColor: background.card,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity cursor-pointer"
          style={{ backgroundColor: text.heading, color: background.card }}
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>
    </div>
  )
}
