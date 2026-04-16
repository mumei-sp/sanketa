import { useMemo } from 'react'
import { Bus, Route, Users, UserCog, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card'
import { TileWrapper, Tile } from '@/components/tile'
import { DashboardStatCard } from '@/features/dashboard/components/DashboardStatCard'
import { StatusPill } from '@/components/ui/status-pill'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { text, status, accent, primary, border, baseColors } from '@/theme/colors'
import { mockVehicles, mockRoutes, mockDrivers, mockStudentAssignments, mockAlerts } from '../mocks'
import { VEHICLE_STATUS_CHART_COLORS, ALERT_SEVERITY_COLORS } from '../constants'
import { getOccupancyPercent, formatDate } from '../utils/transport-utils'
import type { TransportStat } from '../types'

const FEE_COLLECTION_COLORS = [status.success.base, status.warning.base, status.danger.base]

export function TransportOverview() {
  const stats: TransportStat[] = useMemo(() => [
    {
      id: 'total-vehicles',
      label: 'Total Vehicles',
      value: mockVehicles.length,
      icon: Bus,
      iconBg: accent.base,
      iconColor: text.heading,
    },
    {
      id: 'active-routes',
      label: 'Active Routes',
      value: mockRoutes.filter(r => r.status === 'Active').length,
      icon: Route,
      iconBg: primary.base,
      iconColor: text.heading,
    },
    {
      id: 'students-transported',
      label: 'Students Transported',
      value: mockStudentAssignments.length,
      icon: Users,
      iconBg: status.success.muted,
      iconColor: status.success.text,
    },
    {
      id: 'total-drivers',
      label: 'Total Drivers',
      value: mockDrivers.filter(d => d.status === 'Active').length,
      icon: UserCog,
      iconBg: status.info.muted,
      iconColor: status.info.text,
    },
  ], [])

  const vehicleStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    mockVehicles.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [])

  const routeUtilData = useMemo(() => {
    return mockRoutes.map(r => ({
      name: r.code,
      students: r.studentsAssigned,
      capacity: r.capacity,
    }))
  }, [])

  const feeCollectionData = useMemo(() => {
    const paid = mockStudentAssignments.filter(a => a.feeStatus === 'Paid').length
    const pending = mockStudentAssignments.filter(a => a.feeStatus === 'Pending').length
    const overdue = mockStudentAssignments.filter(a => a.feeStatus === 'Overdue').length
    return [
      { name: 'Paid', value: paid },
      { name: 'Pending', value: pending },
      { name: 'Overdue', value: overdue },
    ]
  }, [])

  const collectionRate = useMemo(() => {
    const paid = mockStudentAssignments.filter(a => a.feeStatus === 'Paid').length
    return Math.round((paid / mockStudentAssignments.length) * 100)
  }, [])

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <TileWrapper columns={{ default: 2, lg: 4 }} gap={12}>
        {stats.map(stat => (
          <DashboardStatCard key={stat.id} stat={stat} />
        ))}
      </TileWrapper>

      {/* Charts Row — 3 charts, fixed card height */}
      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        {/* Route Utilization */}
        <Tile id="route-util-chart" layoutMode="block" width={{ default: 1, md: 5 }}>
          <Tile id="route-util-inner" layoutMode="block" background="transparent" padding={0} shadowed={false}>
            <Card className="h-[240px] pt-4 pb-2">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-section-title" style={{ color: text.heading }}>Route Utilization</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-2 pb-0 flex-1 min-h-0 flex flex-col">
                <div className="flex-shrink-0 flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColors.blue }} />
                    <span className="text-xs text-muted-foreground">Capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: baseColors.pink }} />
                    <span className="text-xs text-muted-foreground">Students</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={routeUtilData} barCategoryGap="20%" barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={border.default} opacity={0.3} />
                      <XAxis dataKey="name" fontSize={11} stroke={text.muted} axisLine={false} tickLine={false} />
                      <YAxis fontSize={11} stroke={text.muted} axisLine={false} tickLine={false} width={30} />
                      <Tooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0].payload
                          return (
                            <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
                              <p className="text-xs font-semibold mb-1" style={{ color: text.heading }}>{d.name}</p>
                              <div className="flex items-center gap-2 text-xs" style={{ color: text.heading }}>
                                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: baseColors.blue }} aria-hidden />
                                <span>Capacity:</span>
                                <span className="font-semibold">{d.capacity}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs" style={{ color: text.heading }}>
                                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: baseColors.pink }} aria-hidden />
                                <span>Students:</span>
                                <span className="font-semibold">{d.students}</span>
                              </div>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="capacity" fill={baseColors.blue} radius={[4, 4, 0, 0]} name="Capacity" />
                      <Bar dataKey="students" fill={baseColors.pink} radius={[4, 4, 0, 0]} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Tile>
        </Tile>

        {/* Vehicle Status */}
        <Tile id="vehicle-status-chart" layoutMode="block" width={{ default: 1, md: 3 }}>
          <Tile id="vehicle-inner" layoutMode="block" background="transparent" padding={0} shadowed={false}>
            <Card className="h-[240px] pt-4 pb-2">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-section-title" style={{ color: text.heading }}>Vehicle Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 px-4 pt-2 pb-0">
                <div className="relative w-[100px] h-[100px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={50}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                        isAnimationActive={false}
                      >
                        {vehicleStatusData.map(entry => (
                          <Cell key={entry.name} fill={VEHICLE_STATUS_CHART_COLORS[entry.name] || border.default} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold" style={{ color: text.heading }}>{mockVehicles.length}</span>
                    <span className="text-[8px] text-muted-foreground">Total</span>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  {vehicleStatusData.map(item => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: VEHICLE_STATUS_CHART_COLORS[item.name] || border.default }} />
                        <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: text.heading }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Tile>
        </Tile>

        {/* Fee Collection */}
        <Tile id="fee-collection-chart" layoutMode="block" width={{ default: 1, md: 4 }}>
          <Tile id="fee-inner" layoutMode="block" background="transparent" padding={0} shadowed={false}>
            <Card className="h-[240px] pt-4 pb-2">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-section-title" style={{ color: text.heading }}>Fee Collection</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 px-4 pt-2 pb-0">
                <div className="relative w-[100px] h-[100px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feeCollectionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={50}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                        isAnimationActive={false}
                      >
                        {feeCollectionData.map((entry, i) => (
                          <Cell key={entry.name} fill={FEE_COLLECTION_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold" style={{ color: text.heading }}>{collectionRate}%</span>
                    <span className="text-[8px] text-muted-foreground">Collected</span>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  {feeCollectionData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: FEE_COLLECTION_COLORS[i] }} />
                        <span className="text-[10px] text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: text.heading }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Tile>
        </Tile>
      </TileWrapper>

      {/* Alerts */}
      <Tile id="transport-alerts" layoutMode="block" background="card" borderRadius="lg" shadowed padding={16}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="size-4" style={{ color: status.warning.text }} />
          <h3 className="text-section-title" style={{ color: text.heading }}>Recent Alerts</h3>
        </div>
        <div className="flex flex-col gap-2">
          {mockAlerts.map(alert => {
            const severityLabel = alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)
            return (
              <div key={alert.id} className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusPill label={severityLabel} config={ALERT_SEVERITY_COLORS[alert.severity]} />
                    <span className="text-sm font-medium" style={{ color: text.heading }}>{alert.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.description}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{formatDate(alert.date)}</span>
              </div>
            )
          })}
        </div>
      </Tile>
    </div>
  )
}
