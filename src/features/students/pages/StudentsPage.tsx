import * as React from 'react'
import { StudentsTable } from '../components/StudentsTable'
import { ImportDialog, type ImportColumn } from '@/components/shared/ImportDialog'
import { fetchStudents, createStudent } from '@/api/services/student-service'
import { generateCsv, downloadCsv } from '@/lib/csv'
import { toast } from 'sonner'
import type { Student } from '@/features/students/types'
import { Tile, TileWrapper } from '@/components/tile'
import { EnrollmentTrendsChart } from '@/components/charts/EnrollmentTrendsChart'
import { AttendanceOverviewChart } from '@/components/charts/AttendanceOverviewChart'
import { fetchEnrollmentTrends, fetchAttendanceOverview } from '@/api/services/student-service'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * StudentsPage component that fetches and displays student data with charts
 */
export function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [enrollmentData, setEnrollmentData] = React.useState<EnrollmentData[]>([])
  const [attendanceData, setAttendanceData] = React.useState<AttendanceData[]>([])
  const [isLoadingEnrollment, setIsLoadingEnrollment] = React.useState(true)
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setIsLoadingEnrollment(true)
        setIsLoadingAttendance(true)

        // Fetch all data in parallel
        const [studentsData, enrollment, attendance] = await Promise.all([
          fetchStudents(),
          fetchEnrollmentTrends(),
          fetchAttendanceOverview(),
        ])

        setStudents(studentsData)
        setEnrollmentData(enrollment)
        setAttendanceData(attendance)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingEnrollment(false)
        setIsLoadingAttendance(false)
      }
    }

    loadData()
  }, [])

  // ── Import / Export ──
  const [importOpen, setImportOpen] = React.useState(false)

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
    // Detect duplicate Student IDs within the imported file
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
        gpa: 0,
        percentage: 0,
        performance: 'Good',
        status: 'Active',
      } as Partial<Student>)
    }
    // Refresh student list
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

  if (isLoading) {
    return (
      <TileWrapper columns={12} gap={12}>
        {/* Table skeleton - 8/12 columns on desktop */}
        <Tile
          id="students-table-skeleton"
          layoutMode="grid"
          width={{ default: 12, md: 8 }}
          background="card"
          borderRadius="lg"
          shadowed={false}
          padding="p-6"
        >
          <div className="space-y-4">
            {/* Toolbar skeleton */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Skeleton className="h-7 w-[100px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-[250px] rounded-md" />
                <Skeleton className="h-8 w-[120px] rounded-md" />
                <Skeleton className="h-8 w-[120px] rounded-md" />
              </div>
            </div>
            {/* Table header */}
            <Skeleton className="h-10 w-full rounded" />
            {/* Table rows */}
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-[150px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        </Tile>

        {/* Charts skeleton - 4/12 columns on desktop */}
        <Tile
          id="charts-skeleton"
          layoutMode="grid"
          width={{ default: 12, md: 4 }}
          background="transparent"
          padding={0}
        >
          <div className="flex flex-col gap-6">
            {/* Enrollment Trends Chart skeleton */}
            <div className="bg-card rounded-lg shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-8 w-[110px] rounded-md" />
              </div>
              <Skeleton className="h-[204px] w-full rounded" />
            </div>
            {/* Attendance Overview Chart skeleton */}
            <div className="bg-card rounded-lg shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[160px]" />
                <Skeleton className="h-8 w-[110px] rounded-md" />
              </div>
              <Skeleton className="h-[204px] w-full rounded" />
            </div>
          </div>
        </Tile>
      </TileWrapper>
    )
  }

  return (
  <>
    <TileWrapper columns={12} gap={12}>
      {/* Table - 8/12 columns on desktop, full width on mobile */}
      <Tile
        id="students-table-tile"
        layoutMode="grid"
        width={{ default: 12, md: 8 }}
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
        overflow="auto"
      >
        <StudentsTable
          data={students}
          isLoading={isLoading}
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
        />
      </Tile>

      {/* Charts - 4/12 columns on desktop, full width on mobile, stacked vertically */}
      <Tile
        id="charts-container-tile"
        layoutMode="grid"
        width={{ default: 12, md: 4 }}
        background="transparent"
        padding={0}
      >
        <div className="flex flex-col gap-6">
          <EnrollmentTrendsChart data={enrollmentData} isLoading={isLoadingEnrollment} />
          <AttendanceOverviewChart data={attendanceData} isLoading={isLoadingAttendance} />
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

