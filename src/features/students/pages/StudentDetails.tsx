import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TileWrapper, Tile } from '@/components/tile'
import { Edit } from 'lucide-react'
import { useStudentById } from '@/features/students/hooks/use-student-by-id'
import { StudentProfileCard } from '@/features/students/components/StudentProfileCard'
import { getDisplayName } from '@/features/students/utils/formatting'
import { AcademicPerformance } from '../components/AcademicPerformance'
import { AttendanceCalendar } from '../components/AttendanceCalendar'
import { StudentPageLayout } from '../components/StudentPageLayout'
import { getStudentBreadcrumbs } from '../utils/breadcrumbs'
import { STUDENT_MESSAGES } from '../constants'

/**
 * StudentDetails page component
 * Displays detailed information about a specific student
 */
export default function StudentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { student, isLoading, error } = useStudentById(id)

  const handleBack = React.useCallback(() => {
    navigate('/students')
  }, [navigate])

  const handleEdit = React.useCallback(() => {
    if (id) {
      navigate(`/students/edit/${id}`)
    }
  }, [navigate, id])

  const displayName = student ? getDisplayName(student) : 'Student Details'
  const breadcrumbs = React.useMemo(
    () => getStudentBreadcrumbs('details', displayName),
    [displayName],
  )

  return (
    <StudentPageLayout
      title="Student Details"
      breadcrumbs={breadcrumbs}
      showBackButton
      isLoading={isLoading}
      error={error || (!student && !isLoading ? STUDENT_MESSAGES.NOT_FOUND : null)}
      errorActionLabel={STUDENT_MESSAGES.BACK_TO_STUDENTS}
      onErrorAction={handleBack}
      loadingMessage={STUDENT_MESSAGES.LOADING_DETAILS}
    >
      <TileWrapper columns={12} gap={12} mode="grid">
        {/* Left Column: Student Profile Card (25% - 3 columns) */}
        <Tile
          id="profile-card-wrapper"
          width={3}
          layoutMode="grid"
          background="card"
          borderRadius="xl"
          shadowed
          nested
          padding={16}
          style={{ position: 'relative' }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              width: '2rem',
              height: '2rem',
            }}
          >
            <Edit style={{ width: '1rem', height: '1rem' }} />
          </Button>
          {student && <StudentProfileCard student={student} />}
        </Tile>

        {/* Middle Column: Academic Performance (50% - 6 columns) */}
        {student && (
          <AcademicPerformance
            averageScore={student.percentage}
            studentName={getDisplayName(student)}
            tileWidth={6}
            tileLayoutMode="grid"
          />
        )}

        {/* Right Column: Attendance calendar (25% - 3 columns) */}
        {student && (
          <AttendanceCalendar
            attendanceByDate={student.attendanceByDate}
            tileWidth={3}
            tileLayoutMode="grid"
          />
        )}
      </TileWrapper>
    </StudentPageLayout>
  )
}

