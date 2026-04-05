import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { TileWrapper, Tile } from '@/components/tile'
import {
  ExpenseTrendChart,
  ExpenseBreakdownChart,
  ReimbursementsTracking,
  ExpensesTable,
} from '@/features/expenses/components'
import {
  fetchExpenseTrend,
  fetchExpenseBreakdown,
  fetchReimbursements,
  fetchExpenses,
} from '@/api/services/expenses-service'
import type {
  Expense,
  ExpenseTrendData,
  ExpenseBreakdownData,
  Reimbursement,
} from '@/features/expenses/types'

export default function Expenses() {
  const navigate = useNavigate()

  const [trendData, setTrendData] = React.useState<ExpenseTrendData[]>([])
  const [breakdownData, setBreakdownData] = React.useState<ExpenseBreakdownData[]>([])
  const [breakdownTotal, setBreakdownTotal] = React.useState(0)
  const [reimbursements, setReimbursements] = React.useState<Reimbursement[]>([])
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [trend, breakdown, reimb, exp] = await Promise.all([
          fetchExpenseTrend(),
          fetchExpenseBreakdown(),
          fetchReimbursements(),
          fetchExpenses(),
        ])
        setTrendData(trend)
        setBreakdownData(breakdown.breakdown)
        setBreakdownTotal(breakdown.total)
        setReimbursements(reimb)
        setExpenses(exp)
      } catch (error) {
        console.error('Failed to fetch expenses data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Expenses' },
        ]}
        onBack={() => navigate('/finance')}
      />

      {/*
        Responsive grid layout (40 / 60 split):
        - Mobile:   single column — Trend, Breakdown, Reimbursements stacked
        - Tablet:   row 1: Trend (5) + Breakdown (7)  |  row 2: Reimbursements (12)
        - Desktop:  Trend (5, r1) + Breakdown (5, r2) left  |  Reimbursements (7, r1–r2) right
      */}
      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        <Tile
          id="expense-trend"
          layoutMode="block"
          width={{ default: 1, md: 5 }}
        >
          <ExpenseTrendChart data={trendData} isLoading={isLoading} />
        </Tile>

        <Tile
          id="expense-breakdown"
          layoutMode="block"
          width={{ default: 1, md: 7, lg: 5 }}
          rowStart={{ default: 1, lg: 2 }}
        >
          <ExpenseBreakdownChart
            data={breakdownData}
            total={breakdownTotal}
            isLoading={isLoading}
          />
        </Tile>

        <Tile
          id="reimbursements-tracking"
          layoutMode="block"
          width={{ default: 1, md: 12, lg: 7 }}
          rowStart={{ default: 1, lg: 1 }}
          rowEnd={{ default: 1, lg: 3 }}
        >
          <ReimbursementsTracking data={reimbursements} isLoading={isLoading} />
        </Tile>
      </TileWrapper>

      {/* Expenses Table (full width) */}
      <Tile
        id="expenses-table-tile"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
        overflow="auto"
      >
        <ExpensesTable data={expenses} isLoading={isLoading} />
      </Tile>
    </div>
  )
}
