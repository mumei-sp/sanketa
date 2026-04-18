import * as React from 'react'
import { Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { text, colors } from '@/theme/colors'
import { fontWeights } from '@/config/typography'
import { TileWrapper, Tile, TileCustomizeModal } from '@/components/tile'
import { useTileSelection } from '@/hooks/use-tile-selection'
import type { TeacherStatistics } from '@/mocks/teachers/statistics'
import {
  teacherTileRegistry,
  DEFAULT_TEACHER_TILE_IDS,
  toTeacherTileOptions,
} from '../config/teacher-tile-registry'

interface TeachersDashboardProps {
  statistics: TeacherStatistics
}

interface StatCardProps {
  id: string
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function StatCard({ id, label, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Tile
      id={id}
      background="card"
      borderRadius="lg"
      shadowed
      padding={12}
      className="flex items-center justify-between"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-body-muted font-medium" style={{ color: 'var(--heading)' }}>
          {label}
        </h3>
        <span
          className="text-numeric text-2xl"
          style={{ color: 'var(--heading)', fontWeight: fontWeights.bold }}
        >
          {value.toLocaleString('en-IN')}
        </span>
      </div>
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: iconBg, width: 44, height: 44, minWidth: 44, minHeight: 44 }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
    </Tile>
  )
}

/**
 * Teachers Dashboard Component
 * Displays configurable teacher statistics in a responsive grid.
 * Admin can customize which tiles appear via the Customize button.
 */
export function TeachersDashboard({ statistics }: TeachersDashboardProps) {
  const {
    selectedTiles,
    selectedIds,
    toggle,
    reset,
  } = useTileSelection(teacherTileRegistry, {
    storageKey: 'sanketa:teacher-tiles',
    defaults: DEFAULT_TEACHER_TILE_IDS,
    maxSelections: 4,
  })

  const [customizeOpen, setCustomizeOpen] = React.useState(false)

  return (
    <>
      <div className="flex items-center justify-end mb-1">
        <button
          type="button"
          onClick={() => setCustomizeOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1 transition-colors hover:opacity-80"
          style={{
            color: 'var(--heading)',
            backgroundColor: colors.accent.soft,
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <Settings className="w-3.5 h-3.5" />
          Customize
        </button>
      </div>

      <TileWrapper columns={{ default: 2, lg: 4 }} gap={12}>
        {selectedTiles.map(tile => (
          <StatCard
            key={tile.id}
            id={`stat-${tile.id}`}
            label={tile.label}
            value={tile.getValue(statistics)}
            icon={tile.icon}
            iconBg={tile.iconBg}
            iconColor={tile.iconColor}
          />
        ))}
      </TileWrapper>

      <TileCustomizeModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        options={toTeacherTileOptions(teacherTileRegistry)}
        selectedIds={selectedIds}
        onToggle={toggle}
        onReset={reset}
        maxSelections={4}
        title="Customize Teacher Tiles"
      />
    </>
  )
}
