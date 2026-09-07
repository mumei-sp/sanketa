import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tile } from '@/components/tile'
import { colors } from '@/theme/colors'
import { useBrandColors } from '@/hooks/use-brand-colors'
import { useAcademicDates } from '@/hooks/use-academic-dates'
import { reorderByAcademicMonth } from '@/utils/academic-date'
import { ClassPicker } from '@/components/shared/ClassPicker'
import type { PerformanceDataset } from '../types'

interface StudentPerformanceChartProps {
  datasets: PerformanceDataset[]
  isLoading?: boolean
}

const MIN_WIDTH_PER_ITEM = 80

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--heading)' }}>
          {label}
        </p>
        {payload.map((entry: any) => (
          <div
            key={entry.name}
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--heading)' }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span>{entry.name}:</span>
            <span className="font-semibold">{entry.value}%</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null
  return (
    <div className="flex items-center gap-4 ml-8">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-caption text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function StudentPerformanceChart({ datasets, isLoading = false }: StudentPerformanceChartProps) {
  const [selected, setSelected] = React.useState('')
  const [pickedGrades, setPickedGrades] = React.useState<string[]>([])
  /**
   * Section labels the user has drilled into via the grade card popovers.
   * Arrives from ClassPicker.onSectionsChange. When a grade has all its
   * sections present here we treat it as "no drill-down" and render the
   * grade-level series instead.
   */
  const [pickedSections, setPickedSections] = React.useState<string[]>([])
  /**
   * Grades the user has explicitly flipped into "compare sections" mode from
   * the popover toggle. Arrives from ClassPicker.onCompareGradesChange. This
   * is the escape hatch that lets you compare 9A vs 9B even when both are
   * ticked (which would otherwise look identical to "Grade 9 average").
   */
  const [compareGrades, setCompareGrades] = React.useState<string[]>([])

  // Sync selected to first dataset when datasets load
  React.useEffect(() => {
    if (datasets.length > 0 && !selected) {
      setSelected(datasets[0].value)
    }
  }, [datasets, selected])

  const { startMonth } = useAcademicDates()
  const brand = useBrandColors()
  const SERIES_PALETTE = React.useMemo(
    () => [brand.heading, brand.primary, brand.accent] as const,
    [brand.heading, brand.primary, brand.accent],
  )
  const activeDataset = datasets.find(d => d.value === selected) ?? datasets[0]
  const allGrades = activeDataset?.grades ?? []

  /**
   * Resolve which series to actually render. For each picked grade we look
   * at how many of its sections the user has toggled in the popover:
   *
   *   - All sections on (or no drill-down)  → render `grade{N}` (grade avg)
   *   - Strict subset on                    → render the picked sections as
   *                                           individual series so the user
   *                                           can compare 9A vs 9B vs 9C
   *
   * This is what makes "compare sections of a single class" work — pick
   * the grade card, then open its popover and uncheck the sections you
   * don't want to see. The moment you drop below the full set the chart
   * switches from grade-average to per-section bars.
   *
   * Fallback: if no grades are picked at all, show the first 3 grades so
   * the chart is readable instead of rendering 10+ overlapping series.
   */
  const grades = React.useMemo(() => {
    const pickedSectionSet = new Set(pickedSections)
    const compareSet = new Set(compareGrades)

    // The set of grades the chart should consider. `pickedGrades` is the
    // primary signal — empty pick falls back to first 3 grades so the
    // chart always has something to draw.
    const activeGrades = pickedGrades.length > 0
      ? allGrades.filter(g => pickedGrades.some(p => g.key === `grade${p}`))
      : allGrades.slice(0, 3)

    const out: typeof allGrades = []
    activeGrades.forEach(gradeDef => {
      const sections = gradeDef.sections ?? []
      if (sections.length === 0) {
        out.push(gradeDef)
        return
      }
      const pickedInGrade = sections.filter(s => pickedSectionSet.has(s.key))
      // Two ways to trigger drill-down:
      //   1. User has explicit compare-sections mode on for this grade.
      //   2. User has turned OFF at least one of the grade's sections,
      //      so the remaining subset is clearly an intentional drill.
      const gradeKey = gradeDef.key.replace(/^grade/, '')
      const compareMode = compareSet.has(gradeKey)
      const partialSelection =
        pickedInGrade.length > 0 && pickedInGrade.length < sections.length
      if (compareMode || partialSelection) {
        // Render each picked section as its own series so the bars sit
        // side-by-side for easy comparison.
        pickedInGrade.forEach(s => out.push(s))
      } else {
        // All sections on (or none explicitly on) = treat as grade average.
        out.push(gradeDef)
      }
    })
    // Re-colour every series by its position in the final list — guarantees
    // no two visible bars share a hue even if the mock layer's per-grade
    // and per-section palettes happen to collide.
    return out.map((s, i) => ({
      ...s,
      color: SERIES_PALETTE[i % SERIES_PALETTE.length],
    }))
  }, [allGrades, pickedGrades, pickedSections, compareGrades, SERIES_PALETTE])
  const rawData = activeDataset?.data ?? []
  const data = React.useMemo(
    () => reorderByAcademicMonth(rawData, 'month', startMonth),
    [rawData, startMonth],
  )
  const chartMinWidth = data.length * MIN_WIDTH_PER_ITEM
  const needsScroll = chartMinWidth > 300

  if (isLoading || !activeDataset) {
    return (
      <Tile id="student-performance-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
        <Card className="w-full h-full pt-4 pb-0 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Student Performance</h3>
            <CardAction><Skeleton className="h-9 w-[140px]" /></CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1"><Skeleton className="h-[220px] w-full" /></CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile id="student-performance-tile" layoutMode="block" background="transparent" padding={0} shadowed={false}>
      <Card className="group/chart w-full h-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Student Performance</h3>
          <CardAction>
            <div className="flex items-center gap-2">
              <div className="opacity-100 lg:opacity-0 lg:group-hover/chart:opacity-100 transition-opacity duration-200">
                <ClassPicker
                  storageKey="dash-perf"
                  mode="grade"
                  max={3}
                  onChange={setPickedGrades}
                  onSectionsChange={setPickedSections}
                  onCompareGradesChange={setCompareGrades}
                />
              </div>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="w-[140px] bg-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(ds => (
                    <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-0 flex-1 min-h-0">
          <div className={`h-full ${needsScroll ? 'overflow-x-auto' : ''}`}>
            <div className="chart-scale h-full" style={needsScroll ? { minWidth: chartMinWidth } : undefined}>
              <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.default} opacity={0.3} vertical={false} />
                  <XAxis dataKey="month" stroke={colors.text.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    width={44}
                    stroke={colors.text.muted}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    domain={[0, 100]}
                    tickCount={6}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Legend content={<CustomLegend />} verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8 }} />
                  {grades.map(g => (
                    <Bar key={g.key} dataKey={g.key} name={g.label} fill={g.color} barSize={18} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}
