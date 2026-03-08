import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Expense Trend — 40% on desktop */}
        <div className="md:col-span-5">
          <ExpenseTrendChart data={trendData} isLoading={isLoading} />
        </div>

        {/* Expense Breakdown */}
        {/* Tablet: sits next to Trend (7 cols).  Desktop: drops below Trend (5 cols) */}
        <div className="md:col-span-7 lg:col-span-5 lg:row-start-2">
          <ExpenseBreakdownChart
            data={breakdownData}
            total={breakdownTotal}
            isLoading={isLoading}
          />
        </div>

        {/* Reimbursements Tracking — 60% on desktop, spans both rows */}
        <div className="md:col-span-12 lg:col-span-7 lg:row-start-1 lg:row-end-3">
          <ReimbursementsTracking data={reimbursements} isLoading={isLoading} />
        </div>
      </div>

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
