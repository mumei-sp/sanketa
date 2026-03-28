/**
 * FeesCollection — Fee management page with payment processing, receipts, and history.
 */

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { TileWrapper, Tile } from '@/components/tile'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  FeeStatCards,
  FeeCollectionTrend,
  FeeCollectionProgress,
  FeeCollectionTable,
  PaymentDialog,
  ReceiptPreview,
  PaymentHistorySheet,
} from '@/features/fees-collection/components'
import {
  fetchFeeStats,
  fetchFeeTrend,
  fetchFeeProgress,
  fetchFeeCollection,
  fetchPaymentHistory,
} from '@/api/services/fees-collection-service'
import type {
  FeeStat,
  FeeTrendData,
  FeeProgressData,
  FeeCollectionRecord,
  PaymentTransaction,
} from '@/features/fees-collection/types'

export default function FeesCollection() {
  const navigate = useNavigate()

  // ── Dashboard data ──
  const [stats, setStats] = React.useState<FeeStat[]>([])
  const [trendData, setTrendData] = React.useState<FeeTrendData[]>([])
  const [progressData, setProgressData] = React.useState<FeeProgressData[]>([])
  const [collectionData, setCollectionData] = React.useState<FeeCollectionRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const [statsRes, trendRes, progressRes, collectionRes] = await Promise.all([
        fetchFeeStats(),
        fetchFeeTrend(),
        fetchFeeProgress(),
        fetchFeeCollection(),
      ])
      setStats(statsRes)
      setTrendData(trendRes)
      setProgressData(progressRes)
      setCollectionData(collectionRes)
    } catch (error) {
      console.error('Failed to fetch fees collection data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  // ── Payment dialog ──
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<FeeCollectionRecord | null>(null)

  const handlePay = React.useCallback((record: FeeCollectionRecord) => {
    setSelectedRecord(record)
    setPaymentDialogOpen(true)
  }, [])

  const handlePaymentComplete = React.useCallback(() => {
    // Re-fetch all data to reflect updated payment
    loadData()
  }, [loadData])

  // ── Receipt sheet ──
  const [receiptSheetOpen, setReceiptSheetOpen] = React.useState(false)
  const [receiptTransaction, setReceiptTransaction] = React.useState<PaymentTransaction | null>(null)

  const handleViewReceipt = React.useCallback(async (record: FeeCollectionRecord) => {
    if (!record.transactionId) return
    // Find transaction from history
    const history = await fetchPaymentHistory(record.studentId)
    const txn = history.find(t => t.transactionId === record.transactionId)
    if (txn) {
      setReceiptTransaction(txn)
      setReceiptSheetOpen(true)
    }
  }, [])

  const handleViewReceiptFromTransaction = React.useCallback((txn: PaymentTransaction) => {
    setReceiptTransaction(txn)
    setReceiptSheetOpen(true)
  }, [])

  // ── Payment history sheet ──
  const [historySheetOpen, setHistorySheetOpen] = React.useState(false)
  const [historyStudentId, setHistoryStudentId] = React.useState<string | null>(null)
  const [historyStudentName, setHistoryStudentName] = React.useState('')

  const handleViewHistory = React.useCallback((record: FeeCollectionRecord) => {
    setHistoryStudentId(record.studentId)
    setHistoryStudentName(record.studentName)
    setHistorySheetOpen(true)
  }, [])

  const handlePrint = React.useCallback(() => {
    window.print()
  }, [])

  // ── Table actions ──
  const tableActions = React.useMemo(() => ({
    onPay: handlePay,
    onViewReceipt: handleViewReceipt,
    onViewHistory: handleViewHistory,
  }), [handlePay, handleViewReceipt, handleViewHistory])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fees Collection"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Fees Collection' },
        ]}
        onBack={() => navigate('/finance')}
      />

      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        <Tile id="fee-stats" layoutMode="block" width={{ default: 1, md: 3 }} className="h-full">
          <FeeStatCards stats={stats} isLoading={isLoading} />
        </Tile>
        <Tile id="fee-trend" layoutMode="block" width={{ default: 1, md: 4 }} className="h-full">
          <FeeCollectionTrend data={trendData} isLoading={isLoading} />
        </Tile>
        <Tile id="fee-progress" layoutMode="block" width={{ default: 1, md: 5 }} className="h-full">
          <FeeCollectionProgress data={progressData} isLoading={isLoading} />
        </Tile>
      </TileWrapper>

      <Tile
        id="fees-collection-table-tile"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
        overflow="auto"
      >
        <FeeCollectionTable data={collectionData} isLoading={isLoading} actions={tableActions} />
      </Tile>

      {/* ═══ PAYMENT DIALOG ═══ */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        record={selectedRecord}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* ═══ RECEIPT SHEET ═══ */}
      <Sheet open={receiptSheetOpen} onOpenChange={setReceiptSheetOpen}>
        <SheetContent side="right" size="2xl" className="flex flex-col p-0 gap-0">
          <SheetTitle className="sr-only">Payment Receipt</SheetTitle>
          {receiptTransaction ? (
            <ReceiptPreview
              transaction={receiptTransaction}
              onPrint={handlePrint}
            />
          ) : (
            <div className="flex items-center justify-center py-16 flex-1">
              <span className="text-sm text-text-muted">No receipt data</span>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══ PAYMENT HISTORY SHEET ═══ */}
      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent side="right" size="lg" className="flex flex-col p-0 gap-0">
          <SheetTitle className="sr-only">Payment History</SheetTitle>
          <PaymentHistorySheet
            studentId={historyStudentId}
            studentName={historyStudentName}
            onViewReceipt={handleViewReceiptFromTransaction}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
