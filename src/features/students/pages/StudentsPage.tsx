import * as React from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentsTable } from '../components/StudentsTable'
import { StudentStatGroup, getStudentStats, getGradeCounts } from '../components/StudentStatCards'
import { ClassPicker } from '@/components/shared/ClassPicker'
import { AcademicPerformanceByGradeChart } from '../components/AcademicPerformanceByGradeChart'
import { RecentActivity } from '@/features/dashboard/components/RecentActivity'
import { ImportDialog, type ImportColumn } from '@/components/shared/ImportDialog'
import {
  fetchStudents,
  createStudent,
  fetchEnrollmentTrends,
  fetchAttendanceOverview,
} from '@/api/services/student-service'
import { fetchRecentActivity } from '@/api/services/dashboard-service'
import type { RecentActivityItem } from '@/features/dashboard/types'
import { generateCsv, downloadCsv } from '@/lib/csv'
import { toast } from 'sonner'
import type { Student } from '@/features/students/types'
import { Tile, TileWrapper } from '@/components/tile'
import { EnrollmentTrendsChart } from '@/components/charts/EnrollmentTrendsChart'
import { AttendanceOverviewChart } from '@/components/charts/AttendanceOverviewChart'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

export function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [enrollmentData, setEnrollmentData] = React.useState<EnrollmentData[]>([])
  const [attendanceData, setAttendanceData] = React.useState<AttendanceData[]>([])
  const [isLoadingCharts, setIsLoadingCharts] = React.useState(true)
  const [activityItems, setActivityItems] = React.useState<RecentActivityItem[]>([])
  const [importOpen, setImportOpen] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      try {
        const [studentsData, enrollment, attendance, activity] = await Promise.all([
          fetchStudents(),
          fetchEnrollmentTrends(),
          fetchAttendanceOverview(),
          fetchRecentActivity(),
        ])
        setStudents(studentsData)
        setEnrollmentData(enrollment)
        setAttendanceData(attendance)
        setActivityItems(activity)
      } catch (error) {
        console.error('Failed to fetch students data:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingCharts(false)
      }
    }
    loadData()
  }, [])

  const gradeCounts = React.useMemo(() => getGradeCounts(students), [students])
  const [selectedGrades, setSelectedGrades] = React.useState<string[]>([])
  const stats = React.useMemo(
    () => getStudentStats(students, selectedGrades),
    [students, selectedGrades],
  )

  // ── Import / Export ──
  const studentImportColumns: ImportColumn[] = React.useMemo(() => [
    { csvHeader: 'First Name', fieldKey: 'firstName', label: 'First Name', required: true },
    { csvHeader: 'Last Name', fieldKey: 'lastName', label: 'Last Name', required: true },
    { csvHeader: 'Student ID', fieldKey: 'studentId', label: 'Student ID', required: true },
    { csvHeader: 'Class', fieldKey: 'class', label: 'Class', required: true },
    { csvHeader: 'Section', fieldKey: 'section', label: 'Section' },
    { csvHeader: 'Date of Birth', fieldKey: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { csvHeader: 'Gender', fieldKey: 'gender', label: 'Gender', type: 'enum', enumValues: ['Male', 'Female', 'Other'] },
    { csvHeader: 'Phone', fieldKey: 'primaryPhone', label: 'Phone', type: 'phone' },
    { csvHeader: 'Address', fieldKey: 'address', label: 'Address' },
    { csvHeader: 'Admission Number', fieldKey: 'admissionNumber', label: 'Admission Number' },
  ], [])

  const handleImport = React.useCallback(async (rows: Record<string, string>[]) => {
    const ids = rows.map(r => r['Student ID']?.trim()).filter(Boolean)
    const seen = new Set<string>()
    const dupes = new Set<string>()
    ids.forEach(id => { if (seen.has(id)) dupes.add(id); else seen.add(id) })
    if (dupes.size > 0) {
      toast.error(`Duplicate Student IDs in file: ${[...dupes].join(', ')}`)
      return
    }
    for (const row of rows) {
      await createStudent({
        firstName: row['First Name'] || '',
        lastName: row['Last Name'] || '',
        studentId: row['Student ID'] || `S-${Date.now()}`,
        class: row['Class'] || '7A',
        section: row['Section'] || 'A',
        gradeLevel: (row['Class'] || '7').replace(/[A-Z]/g, ''),
        dateOfBirth: row['Date of Birth'] || undefined,
        primaryPhone: row['Phone'] || undefined,
        address: row['Address'] || undefined,
        admissionNumber: row['Admission Number'] || undefined,
        gpa: 0, percentage: 0, performance: 'Good', status: 'Active',
      } as Partial<Student>)
    }
    const updated = await fetchStudents()
    setStudents(updated)
    toast.success(`${rows.length} students imported`)
  }, [])

  const handleExport = React.useCallback(() => {
    const csv = generateCsv(students, [
      { key: 'studentId', header: 'Student ID' },
      { key: 'firstName', header: 'First Name' },
      { key: 'lastName', header: 'Last Name' },
      { key: 'class', header: 'Class' },
      { key: 'section', header: 'Section' },
      { key: 'gpa', header: 'GPA' },
      { key: 'percentage', header: 'Percentage' },
      { key: 'performance', header: 'Performance' },
      { key: 'status', header: 'Status' },
      { key: 'dateOfBirth', header: 'Date of Birth' },
      { key: 'primaryPhone', header: 'Phone' },
      { key: 'admissionNumber', header: 'Admission Number' },
    ])
    downloadCsv(csv, 'students-export.csv')
  }, [students])

  return (
    <>
      <TileWrapper columns={12} gap={16}>

        {/* ── Top band ── */}

        {/* Stat Cards Group — 2×2 on mobile/desktop, 1×4 on tablet */}
        <Tile id="stat-group" layoutMode="grid" width={{ default: 12, lg: 3 }} padding={0}>
          {isLoading
            ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-[84px] w-full rounded-xl" />
                ))}
              </div>
            )
            : (
              <StudentStatGroup
                stats={stats}
                action={
                  <ClassPicker
                    storageKey="student-stats"
                    mode="grade"
                    max={3}
                    gradeCounts={gradeCounts}
                    onChange={setSelectedGrades}
                  />
                }
              />
            )
          }
        </Tile>

        {/* Academic Performance — 5/12 on desktop */}
        <Tile
          id="academic-performance-chart"
          layoutMode="grid"
          width={{ default: 12, lg: 5 }}
          padding={0}
        >
          <AcademicPerformanceByGradeChart isLoading={isLoadingCharts} />
        </Tile>

        {/* Enrollment Trends — 4/12 on desktop, 6/12 on tablet */}
        <Tile
          id="enrollment-trends"
          layoutMode="grid"
          width={{ default: 12, md: 6, lg: 4 }}
          padding={0}
        >
          <EnrollmentTrendsChart data={enrollmentData} isLoading={isLoadingCharts} />
        </Tile>

        {/* ── Bottom band ── */}

        {/* Students Table — 8/12 on desktop */}
        <Tile
          id="students-table"
          layoutMode="grid"
          width={{ default: 12, lg: 8 }}
          background="card"
          borderRadius="lg"
          shadowed={false}
          padding="p-6"
          overflow="auto"
          className="relative"
        >
          {/* Import/Export overlay buttons — top-right of tile */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={handleExport}
              title="Export students"
            >
              <Download className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setImportOpen(true)}
              title="Import students"
            >
              <Upload className="size-3.5" />
            </Button>
          </div>
          <StudentsTable
            data={students}
            isLoading={isLoading}
          />
        </Tile>

        {/* Right Column: Attendance Overview stacked above Special Programs — 4/12 on desktop */}
        <Tile
          id="right-col"
          layoutMode="grid"
          width={{ default: 12, lg: 4 }}
          padding={0}
        >
          <div className="flex flex-col gap-4 h-full">
            <AttendanceOverviewChart data={attendanceData} isLoading={isLoadingCharts} />
            <RecentActivity items={activityItems} isLoading={isLoadingCharts} />
          </div>
        </Tile>

      </TileWrapper>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Students"
        columns={studentImportColumns}
        templateSampleRows={[
          ['John', 'Doe', 'S-9001', '7A', 'A', '2012-05-15', 'Male', '9876543210', '123 Main St', 'ADM-2025-001'],
        ]}
        onImport={handleImport}
      />
    </>
  )
}
