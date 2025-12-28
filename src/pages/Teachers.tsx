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
import { TileWrapper, Tile } from '@/components/tile'
import { Search, Plus } from 'lucide-react'
import { fetchTeachers, fetchTeacherStatistics } from '@/api/services/teacher-service'
import type { Teacher } from '@/features/teachers/types'
import type { TeacherStatistics } from '@/data/mocks/teacher-statistics'
import { TeacherCard, TeachersDashboard } from '@/features/teachers/components'
import { getDisplayName } from '@/features/teachers/utils/formatting'
import { GridPagination } from '@/components/pagination/GridPagination'
import { baseColors, text, colors } from '@/theme/colors'
import { TeacherAttendanceChart } from '@/components/charts/TeacherAttendanceChart'
import { WorkloadDistributionChart } from '@/components/charts/WorkloadDistributionChart'
import { fetchAttendanceOverview } from '@/services/dashboard-service'
import type { AttendanceData } from '@/data/dashboard'

type SortOption = 'latest' | 'name-asc' | 'name-desc'

/**
 * Teachers page component
 * Displays teachers in a grid layout with search, filter, sort, and pagination
 */
export default function Teachers() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [teacherStatistics, setTeacherStatistics] = React.useState<TeacherStatistics | null>(null)
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

    // Apply search filter
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

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return getDisplayName(a).localeCompare(getDisplayName(b))
        case 'name-desc':
          return getDisplayName(b).localeCompare(getDisplayName(a))
        case 'latest':
        default:
          // Sort by ID descending (assuming higher ID = newer)
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
      // Navigate to teacher details page (if exists)
      // For now, just log or navigate to a placeholder
      console.log('View details for teacher:', teacher.id)
      // navigate(`/teachers/details/${teacher.id}`)
    },
    [],
  )

  const handleAddTeacher = React.useCallback(() => {
    // Navigate to add teacher page (if exists)
    console.log('Add teacher')
    // navigate('/teachers/add')
  }, [])

  // No-op handler for placeholder card
  const handlePlaceholderClick = React.useCallback(() => {
    // No-op for now
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Teachers' }]}
      />

      {/* Teachers Dashboard Statistics and Charts with Placeholder Card */}
      <div className="relative space-y-4">
        {/* Teachers Dashboard Statistics */}
        {teacherStatistics && <TeachersDashboard statistics={teacherStatistics} />}

        {/* Charts Section - Attendance Overview and Workload Distribution */}
        <div className="space-y-1 w-full">
          <TileWrapper mode="flex" gap={16} className="w-[70%]">
            <TeacherAttendanceChart data={attendanceData} isLoading={isLoadingAttendance} />
            <WorkloadDistributionChart isLoading={isLoadingAttendance} />
          </TileWrapper>

        {/* Toolbar */}
        <Tile
          id="teachers-toolbar"
          layoutMode="block"
          background="default"
          borderRadius="lg"
          padding={16}
        >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Teachers heading on the left */}
          <h1 className="text-page-title text-heading">Teachers</h1>

          {/* All controls on the right */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px] max-w-[300px]">
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
        </div>
      </Tile>
        </div>

        {/* Placeholder Card - 30% width, same height as cards */}
        <Tile
          id="teachers-placeholder-card"
          layoutMode="absolute"
          widthPx="calc(30% - 8px)"
          heightPx={344}
          background={colors.background.card}
          borderRadius="lg"
          onClick={handlePlaceholderClick}
          style={{
            left: 'calc(70% + 8px)',
            top: 0,
          }}
        >
          {/* Empty content - placeholder for future use */}
        </Tile>
      </div>

      {/* Teachers Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading teachers...</div>
        </div>
      ) : paginatedTeachers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {searchQuery ? 'No teachers found matching your search.' : 'No teachers available.'}
          </div>
        </div>
      ) : (
        <>
          <TileWrapper columns={12} gap={12} mode="grid">
            {paginatedTeachers.map(teacher => (
              <Tile
                key={teacher.id}
                id={`teacher-tile-${teacher.id}`}
                layoutMode="grid"
                width={3}
                nested
              >
                <TeacherCard teacher={teacher} onViewDetails={handleViewDetails} />
              </Tile>
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
