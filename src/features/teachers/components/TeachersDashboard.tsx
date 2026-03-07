import { TileWrapper, Tile } from '@/components/tile'
import { Users, Clock, RefreshCw } from 'lucide-react'
import { baseColors, text, colors } from '@/theme/colors'
import { fontWeights } from '@/config/typography'

interface TeacherStatistics {
  total: number
  fullTime: number
  partTime: number
  substitute: number
}

interface TeachersDashboardProps {
  statistics: TeacherStatistics
}

/**
 * Teachers Dashboard Component
 * Displays teacher statistics in a grid of tiles
 */
export function TeachersDashboard({ statistics }: TeachersDashboardProps) {
  const stats: TeacherStatistics = statistics

  return (
    <div className="w-full md:w-[70%] min-w-0">
      {/* w-full on mobile so stats use full width; md:w-[70%] on desktop. min-w-0 allows shrink. responsive: stat cards stack in one column on mobile. */}
      <TileWrapper mode="grid" columns={12} gap={12} responsive>
        {/* Total Teachers Card */}
        <Tile
          id="teachers-total"
          layoutMode="grid"
          width={3}
          heightPx={70}
          background="card"
          borderRadius="lg"
          shadowed
          padding="p-3"
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col gap-2">
              <h3 className="text-body-muted font-medium" style={{ color: text.heading }}>
                Total Teachers
              </h3>
              <span
                className="text-numeric text-2xl font-black"
                style={{ color: text.heading, fontWeight: fontWeights.bold }}
              >
                {stats.total}
              </span>
            </div>
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: baseColors.heading, // Dark blue
              }}
            >
              <Users className="w-6 h-6" style={{ color: colors.background.card }} />
            </div>
          </div>
        </Tile>

        {/* Full-Time Teacher Card */}
        <Tile
          id="teachers-fulltime"
          layoutMode="grid"
          width={3}
          heightPx={70}
          background="card"
          borderRadius="lg"
          shadowed
          padding="p-3"
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col gap-2">
              <h3 className="text-body-muted font-medium" style={{ color: text.heading }}>
                Full-Time Teacher
              </h3>
              <span
                className="text-numeric text-2xl font-black"
                style={{ color: text.heading, fontWeight: fontWeights.bold }}
              >
                {stats.fullTime}
              </span>
            </div>
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: baseColors.pink, // Light pink
              }}
            >
              <Clock className="w-6 h-6" style={{ color: text.heading }} />
            </div>
          </div>
        </Tile>

        {/* Part-Time Teacher Card */}
        <Tile
          id="teachers-parttime"
          layoutMode="grid"
          width={3}
          heightPx={70}
          background="card"
          borderRadius="lg"
          shadowed
          padding="p-3"
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col gap-2">
              <h3 className="text-body-muted font-medium" style={{ color: text.heading }}>
                Part-Time Teacher
              </h3>
              <span
                className="text-numeric text-2xl font-black"
                style={{ color: text.heading, fontWeight: fontWeights.bold }}
              >
                {stats.partTime}
              </span>
            </div>
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: baseColors.blue, // Light blue
              }}
            >
              <Clock className="w-6 h-6" style={{ color: text.heading }} />
            </div>
          </div>
        </Tile>

        {/* Substitute Teacher Card */}
        <Tile
          id="teachers-substitute"
          layoutMode="grid"
          width={3}
          heightPx={70}
          background="card"
          borderRadius="lg"
          shadowed
          padding="p-3"
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col gap-2">
              <h3 className="text-body-muted font-medium" style={{ color: text.heading }}>
                Substitute Teacher
              </h3>
              <span
                className="text-numeric text-2xl font-black"
                style={{ color: text.heading, fontWeight: fontWeights.bold }}
              >
                {stats.substitute}
              </span>
            </div>
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: baseColors.pink, // Light pink
              }}
            >
              <RefreshCw className="w-6 h-6" style={{ color: text.heading }} />
            </div>
          </div>
        </Tile>
      </TileWrapper>
    </div>
  )
}
