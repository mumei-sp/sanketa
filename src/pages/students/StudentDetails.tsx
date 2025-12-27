import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { TileWrapper, Tile } from '@/components/tile'
import { Edit } from 'lucide-react'
import { useStudentById } from '@/features/students/hooks/use-student-by-id'
import { StudentProfileCard } from '@/features/students/components/StudentProfileCard'
import { getDisplayName } from '@/features/students/utils/formatting'
import { AcademicPerformance } from './AcademicPerformance'

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Student Details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Students', href: '/students' },
            { label: 'Student Details' },
          ]}
          showBackButton
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading student details...</div>
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Student Details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Students', href: '/students' },
            { label: 'Student Details' },
          ]}
          showBackButton
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error || 'Student not found'}</p>
            <Button onClick={handleBack} variant="outline">
              Back to Students
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const displayName = student ? getDisplayName(student) : 'Student Details'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Students', href: '/students' },
          { label: displayName },
        ]}
        showBackButton
      />

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
          <StudentProfileCard student={student} />
        </Tile>

        {/* Middle Column: Academic Performance (50% - 6 columns) */}
        <AcademicPerformance
          averageScore={student.percentage}
          studentName={getDisplayName(student)}
          tileWidth={6}
          tileLayoutMode="grid"
        />

        {/* Right Column: Empty space (25% - 3 columns) */}
      </TileWrapper>
    </div>
  )
}
