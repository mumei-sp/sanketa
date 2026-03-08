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
import { useIsDesktop, useIsMobile } from '@/hooks/use-mobile'

type SortOption = 'latest' | 'name-asc' | 'name-desc'

/**
 * Teachers page component
 * Displays teachers in a grid layout with search, filter, sort, and pagination
 */
export default function Teachers() {
  const isDesktop = useIsDesktop()
  const isMobile = useIsMobile()
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

      {/* Top Section: Stats + Charts + Department Chart */}
      {isDesktop ? (
        /* Desktop: Left 70% (stats + charts) | Right 30% (department) */
        <div className="flex gap-3 items-stretch">
          <div className="w-[70%] shrink-0 space-y-3">
            {teacherStatistics && <TeachersDashboard statistics={teacherStatistics} />}
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <TeacherAttendanceChart data={attendanceData} isLoading={isLoadingAttendance} />
              </div>
              <div className="flex-1 min-w-0">
                <WorkloadDistributionChart isLoading={isLoadingAttendance} />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <DepartmentChart data={departmentData} total={totalTeachers} />
          </div>
        </div>
      ) : (
        /* Tablet/Mobile: Stacked layout */
        <div className="space-y-3">
          {/* Stats + Department side by side on tablet, stacked on mobile */}
          {isMobile ? (
            <>
              {teacherStatistics && <TeachersDashboard statistics={teacherStatistics} />}
              <TeacherAttendanceChart data={attendanceData} isLoading={isLoadingAttendance} />
              <WorkloadDistributionChart isLoading={isLoadingAttendance} />
              <DepartmentChart data={departmentData} total={totalTeachers} />
            </>
          ) : (
            <>
              {/* Tablet: stats + department side by side */}
              <div className="flex gap-3 items-stretch">
                <div className="w-[55%] shrink-0">
                  {teacherStatistics && <TeachersDashboard statistics={teacherStatistics} />}
                </div>
                <div className="flex-1 min-w-0">
                  <DepartmentChart data={departmentData} total={totalTeachers} />
                </div>
              </div>
              <TeacherAttendanceChart data={attendanceData} isLoading={isLoadingAttendance} />
              <WorkloadDistributionChart isLoading={isLoadingAttendance} />
            </>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-background rounded-lg p-4">
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
          <div className={
            isDesktop
              ? 'grid grid-cols-4 gap-3'
              : isMobile
                ? 'grid grid-cols-1 gap-3'
                : 'grid grid-cols-2 gap-3'
          }>
            {paginatedTeachers.map(teacher => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

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
