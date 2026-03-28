/**
 * FeesCollection — Fee management page with student detail side panel.
 *
 * Click any row to open the student's fee panel with all fees,
 * payment actions, and transaction history.
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
} from '@/features/fees-collection/components'
import { FeeStudentPanel } from '@/features/fees-collection/components/FeeStudentPanel'
import {
  fetchFeeStats,
  fetchFeeTrend,
  fetchFeeProgress,
  fetchFeeCollection,
} from '@/api/services/fees-collection-service'
import type {
  FeeStat,
  FeeTrendData,
  FeeProgressData,
  FeeCollectionRecord,
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

  // ── Student detail panel ──
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null)
  const panelOpen = selectedStudentId !== null

  const handleRowClick = React.useCallback((record: FeeCollectionRecord) => {
    setSelectedStudentId(record.studentId)
  }, [])

  const handleClosePanel = React.useCallback(() => {
    setSelectedStudentId(null)
  }, [])

  const handleDataChanged = React.useCallback(() => {
    loadData()
  }, [loadData])

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
        <FeeCollectionTable
          data={collectionData}
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />
      </Tile>

      {/* ═══ STUDENT FEE DETAIL PANEL ═══ */}
      <Sheet open={panelOpen} onOpenChange={open => { if (!open) handleClosePanel() }}>
        <SheetContent side="right" size="2xl" className="flex flex-col p-0 gap-0">
          <SheetTitle className="sr-only">Student Fee Details</SheetTitle>
          <FeeStudentPanel
            studentId={selectedStudentId}
            allRecords={collectionData}
            onDataChanged={handleDataChanged}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
