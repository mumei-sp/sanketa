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
import type { Student } from '@/features/students/types'

/**
 * Order of content sections beside the profile.
 * Change this array to control which section appears where (first = left of profile, last = right).
 * Each entry: { id, width (grid columns), render }
 */
const DETAIL_CONTENT_SECTIONS: Array<{
  id: string
  width: number
  render: (student: Student) => React.ReactNode
}> = [
  {
    id: 'calendar',
    width: 3,
    render: student => (
      <AttendanceCalendar
        attendanceByDate={student.attendanceByDate}
        tileWidth={3}
        tileLayoutMode="grid"
      />
    ),
  },
  {
    id: 'academic',
    width: 6,
    render: student => (
      <AcademicPerformance
        averageScore={student.percentage}
        studentName={getDisplayName(student)}
        tileWidth={6}
        tileLayoutMode="grid"
      />
    ),
  },
]

/**
 * StudentDetails page component
 * Layout: Profile (left) | Content sections in DETAIL_CONTENT_SECTIONS order (calendar, then academic by default)
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
        {/* Left: Student Profile (fixed) */}
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

        {/* Content sections: order and width from DETAIL_CONTENT_SECTIONS (e.g. calendar, then academic) */}
        {student &&
          DETAIL_CONTENT_SECTIONS.map(section => (
            <React.Fragment key={section.id}>
              {section.render(student)}
            </React.Fragment>
          ))}
      </TileWrapper>
    </StudentPageLayout>
  )
}

