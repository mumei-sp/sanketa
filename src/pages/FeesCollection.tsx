import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { TileWrapper, Tile } from '@/components/tile'
import {
  FeeStatCards,
  FeeCollectionTrend,
  FeeCollectionProgress,
  FeeCollectionTable,
} from '@/features/fees-collection/components'
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

  const [stats, setStats] = React.useState<FeeStat[]>([])
  const [trendData, setTrendData] = React.useState<FeeTrendData[]>([])
  const [progressData, setProgressData] = React.useState<FeeProgressData[]>([])
  const [collectionData, setCollectionData] = React.useState<FeeCollectionRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
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
    }

    loadData()
  }, [])

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

      {/*
        Responsive grid layout:
        - Mobile:   single column — Stats, Trend, Progress stacked
        - Tablet:   row 1: Stats (12) | row 2: Trend (12) | row 3: Progress (12)
        - Desktop:  row 1: Stats (3) + Trend (4) + Progress (5)
      */}
      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        <Tile
          id="fee-stats"
          layoutMode="block"
          width={{ default: 1, md: 3 }}
          className="h-full"
        >
          <FeeStatCards stats={stats} isLoading={isLoading} />
        </Tile>

        <Tile
          id="fee-trend"
          layoutMode="block"
          width={{ default: 1, md: 4 }}
          className="h-full"
        >
          <FeeCollectionTrend data={trendData} isLoading={isLoading} />
        </Tile>

        <Tile
          id="fee-progress"
          layoutMode="block"
          width={{ default: 1, md: 5 }}
          className="h-full"
        >
          <FeeCollectionProgress data={progressData} isLoading={isLoading} />
        </Tile>
      </TileWrapper>

      {/* Fees Collection Table (full width) */}
      <Tile
        id="fees-collection-table-tile"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
        overflow="auto"
      >
        <FeeCollectionTable data={collectionData} isLoading={isLoading} />
      </Tile>
    </div>
  )
}
