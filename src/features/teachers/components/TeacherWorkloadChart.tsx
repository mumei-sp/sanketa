import * as React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SectionCard } from '@/components/ui/section-card'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, accent, primary, border, background } from '@/theme/colors'
import type { WorkloadDataPoint } from '../types/teacher-detail'

const PERIODS = ['Last 8 months', 'Last 6 months', 'Last 3 months', 'This month']

interface TeacherWorkloadChartProps {
  data: WorkloadDataPoint[]
  workloadByPeriod?: Record<string, WorkloadDataPoint[]>
}

/**
 * Custom tooltip for the workload chart
 */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div
      style={{
        backgroundColor: background.card,
        border: `1px solid ${border.default}`,
        borderRadius: spacing['2'],
        padding: spacing['3'],
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <p style={{ fontSize: fontSizes.sm, fontWeight: 600, color: text.heading, margin: 0, marginBottom: spacing['1'] }}>
        {label} {new Date().getFullYear()}
      </p>
      {payload.map((entry, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], marginTop: spacing['1'] }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: entry.color,
            }}
          />
          <span style={{ fontSize: fontSizes.xs, color: text.body }}>
            {entry.name}: <strong>{entry.value} Hours</strong>
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * TeacherWorkloadChart - Area chart showing workload distribution over months
 */
export function TeacherWorkloadChart({ data, workloadByPeriod }: TeacherWorkloadChartProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState(PERIODS[0])
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Use period data if available, otherwise fall back to data prop
  const activeData = workloadByPeriod?.[selectedPeriod] ?? data

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const dropdownButton = (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="hover:opacity-90 transition-opacity"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          fontSize: fontSizes.sm,
          padding: `${spacing['2']} ${spacing['4']}`,
          borderRadius: spacing['3'],
          border: 'none',
          backgroundColor: accent.base,
          color: text.heading,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: spacing['1.5'],
          fontWeight: 500,
        }}
      >
        {selectedPeriod}
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: spacing['1'],
            backgroundColor: background.card,
            border: `1px solid ${border.default}`,
            borderRadius: spacing['2'],
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
            minWidth: '140px',
            overflow: 'hidden',
          }}
        >
          {PERIODS.map(period => (
            <button
              key={period}
              onClick={() => { setSelectedPeriod(period); setIsOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: `${spacing['2']} ${spacing['3']}`,
                fontSize: fontSizes.xs,
                fontWeight: period === selectedPeriod ? 600 : 400,
                color: period === selectedPeriod ? text.heading : text.body,
                backgroundColor: period === selectedPeriod ? accent.base : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {period}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <SectionCard title="Workload Summary" action={dropdownButton}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing['4'], fontSize: fontSizes.xs, color: text.body, marginBottom: spacing['2'] }}>
        {[
          { label: 'Total Classes', color: text.heading, dashed: true },
          { label: 'Teaching Hours', color: accent.base, dashed: false },
          { label: 'Extra Duties', color: primary.base, dashed: false },
        ].map(item => (
          <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: spacing['1.5'] }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: item.dashed ? 'transparent' : item.color,
                border: item.dashed ? `2px dashed ${item.color}` : 'none',
                display: 'inline-block',
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="teachingHoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent.base} stopOpacity={0.4} />
                <stop offset="95%" stopColor={accent.base} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="extraDutiesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primary.base} stopOpacity={0.4} />
                <stop offset="95%" stopColor={primary.base} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={border.subtle} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: text.body }}
              tickLine={false}
              axisLine={{ stroke: border.default }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: text.body }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalClasses"
              name="Total Classes"
              stroke={text.heading}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="teachingHours"
              name="Teaching Hours"
              stroke={accent.base}
              strokeWidth={1.5}
              fill="url(#teachingHoursGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="extraDuties"
              name="Extra Duties"
              stroke={primary.base}
              strokeWidth={1.5}
              fill="url(#extraDutiesGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}
