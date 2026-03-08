import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'
import { fetchTeachers, fetchTeacherStatistics, fetchDepartmentDistribution } from '@/api/services/teacher-service'
import type { Teacher } from '@/features/teachers/types'
import type { TeacherStatistics, DepartmentData } from '@/data/mocks/teacher-statistics'
import { TeacherCard, TeachersDashboard } from '@/features/teachers/components'
import { getDisplayName } from '@/features/teachers/utils/formatting'
import { GridPagination } from '@/components/pagination/GridPagination'
import { baseColors, text } from '@/theme/colors'
import { TeacherAttendanceChart } from '@/components/charts/TeacherAttendanceChart'
import { WorkloadDistributionChart } from '@/components/charts/WorkloadDistributionChart'
import { DepartmentChart } from '@/components/charts/DepartmentChart'
import { fetchAttendanceOverview } from '@/api/services/student-service'
import type { AttendanceData } from '@/data/dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { TileWrapper, Tile } from '@/components/tile'

type SortOption = 'latest' | 'name-asc' | 'name-desc'

/** Skeleton for the 4 stat cards */
function StatsSkeleton() {
  return (
    <TileWrapper columns={{ default: 2, lg: 4 }} gap={12}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Tile key={i} id={`stat-skeleton-${i}`} background="card" borderRadius="lg" shadowed padding={12} className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
          </div>
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
        </Tile>
      ))}
    </TileWrapper>
  )
}

/** Skeleton for a single teacher card */
function TeacherCardSkeleton() {
  return (
    <Tile id="teacher-card-skeleton" background="card" borderRadius="lg" shadowed padding={16} className="flex flex-col gap-3">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
      </div>
      {/* Contact lines */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded shrink-0" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded shrink-0" />
          <Skeleton className="h-3 w-44 rounded" />
        </div>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-full" />
        </div>
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
    </Tile>
  )
}

/**
 * Teachers page component
 * Displays teachers in a grid layout with search, filter, sort, and pagination
 */
export default function Teachers() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [teacherStatistics, setTeacherStatistics] = React.useState<TeacherStatistics | null>(null)
  const [departmentData, setDepartmentData] = React.useState<DepartmentData[]>([])
  const [attendanceData, setAttendanceData] = React.useState<AttendanceData[]>([])
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortOption, setSortOption] = React.useState<SortOption>('latest')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(8)

  // Fetch teachers on mount
  React.useEffect(() => {
    async function loadTeachers() {
      try {
        setIsLoading(true)
        const data = await fetchTeachers()
        setTeachers(data)
      } catch (error) {
        console.error('Failed to fetch teachers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeachers()
  }, [])

  // Fetch teacher statistics on mount
  React.useEffect(() => {
    async function loadStatistics() {
      try {
        const statistics = await fetchTeacherStatistics()
        setTeacherStatistics(statistics)
      } catch (error) {
        console.error('Failed to fetch teacher statistics:', error)
      }
    }

    loadStatistics()
  }, [])

  // Fetch department distribution on mount
  React.useEffect(() => {
    async function loadDepartments() {
      try {
        const data = await fetchDepartmentDistribution()
        setDepartmentData(data)
      } catch (error) {
        console.error('Failed to fetch department data:', error)
      }
    }

    loadDepartments()
  }, [])

  // Fetch attendance data on mount
  React.useEffect(() => {
    async function loadAttendance() {
      try {
        setIsLoadingAttendance(true)
        const data = await fetchAttendanceOverview()
        setAttendanceData(data)
      } catch (error) {
        console.error('Failed to fetch attendance data:', error)
      } finally {
        setIsLoadingAttendance(false)
      }
    }

    loadAttendance()
  }, [])

  // Filter and sort teachers
  const filteredAndSortedTeachers = React.useMemo(() => {
    let filtered = teachers

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(teacher => {
        const displayName = getDisplayName(teacher).toLowerCase()
        const teacherId = teacher.teacherId.toLowerCase()
        const subject = teacher.subject.toLowerCase()
        const email = teacher.email.toLowerCase()

        return (
          displayName.includes(query) ||
          teacherId.includes(query) ||
          subject.includes(query) ||
          email.includes(query)
        )
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return getDisplayName(a).localeCompare(getDisplayName(b))
        case 'name-desc':
          return getDisplayName(b).localeCompare(getDisplayName(a))
        case 'latest':
        default:
          const aId = parseInt(a.teacherId.replace('T-', '')) || 0
          const bId = parseInt(b.teacherId.replace('T-', '')) || 0
          return bId - aId
      }
    })

    return sorted
  }, [teachers, searchQuery, sortOption])

  // Paginate teachers
  const paginatedTeachers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedTeachers.slice(startIndex, endIndex)
  }, [filteredAndSortedTeachers, currentPage, pageSize])

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortOption])

  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSortChange = React.useCallback((value: string) => {
    setSortOption(value as SortOption)
  }, [])

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = React.useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const handleViewDetails = React.useCallback(
    (teacher: Teacher) => {
      console.log('View details for teacher:', teacher.id)
    },
    [],
  )

  const handleAddTeacher = React.useCallback(() => {
    console.log('Add teacher')
  }, [])

  const totalTeachers = teacherStatistics?.total ?? 86

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Teachers' }]}
      />

      {/* Top Section: Stats + Charts + Department Chart
          - Mobile: all stacked (DOM order)
          - Tablet: Stats (7) + Dept (5) side by side, charts stacked below
          - Desktop: Stats (8) top-left, 2 charts (4+4) below, Dept (4) right spanning 2 rows
      */}
      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        <Tile id="teacher-stats" layoutMode="block" width={{ default: 1, md: 7, lg: 8 }}>
          {teacherStatistics ? <TeachersDashboard statistics={teacherStatistics} /> : <StatsSkeleton />}
        </Tile>

        <Tile id="teacher-attendance-chart" layoutMode="block" width={{ default: 1, md: 12, lg: 4 }}>
          <TeacherAttendanceChart data={attendanceData} isLoading={isLoadingAttendance} />
        </Tile>

        <Tile
          id="teacher-workload-chart"
          layoutMode="block"
          width={{ default: 1, md: 12, lg: 4 }}
          colStart={{ lg: 5 }}
        >
          <WorkloadDistributionChart isLoading={isLoadingAttendance} />
        </Tile>

        <Tile
          id="teacher-department-chart"
          layoutMode="block"
          width={{ default: 1, md: 5, lg: 4 }}
          colStart={{ md: 8, lg: 9 }}
          rowStart={{ md: 1 }}
          rowEnd={{ lg: 3 }}
        >
          <DepartmentChart data={departmentData} total={totalTeachers} />
        </Tile>
      </TileWrapper>

      {/* Toolbar */}
      <Tile
        id="teacher-toolbar"
        layoutMode="block"
        background="default"
        borderRadius="lg"
        padding="p-4"
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <h2 className="text-page-title text-heading">Teachers</h2>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative min-w-[160px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search teacher"
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-8 w-full pl-10 bg-white"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
            <Select value={sortOption} onValueChange={handleSortChange}>
              <SelectTrigger
                className="h-8 w-[120px]"
                style={{
                  backgroundColor: baseColors.blue,
                  color: text.heading,
                  borderColor: baseColors.blue,
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Teacher Button */}
          <Button
            onClick={handleAddTeacher}
            className="h-8 bg-primary hover:bg-primary/90 text-foreground"
          >
            <Plus className="size-4" />
            Add Teacher
          </Button>
        </div>
      </Tile>

      {/* Teachers Grid */}
      {isLoading ? (
        <TileWrapper columns={{ default: 1, md: 2, lg: 4 }} gap={12}>
          {Array.from({ length: pageSize }).map((_, i) => (
            <TeacherCardSkeleton key={i} />
          ))}
        </TileWrapper>
      ) : paginatedTeachers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {searchQuery ? 'No teachers found matching your search.' : 'No teachers available.'}
          </div>
        </div>
      ) : (
        <>
          <TileWrapper columns={{ default: 1, md: 2, lg: 4 }} gap={12}>
            {paginatedTeachers.map(teacher => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onViewDetails={handleViewDetails}
              />
            ))}
          </TileWrapper>

          {/* Pagination */}
          {filteredAndSortedTeachers.length > 0 && (
            <GridPagination
              currentPage={currentPage}
              totalItems={filteredAndSortedTeachers.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[8, 16, 24, 32]}
            />
          )}
        </>
      )}
    </div>
  )
}
