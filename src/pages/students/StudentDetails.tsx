import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { PerformanceBadge } from './PerformanceBadge'
import { AttendanceIndicator } from './AttendanceIndicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TileWrapper, Tile } from '@/components/tile'
import { Edit } from 'lucide-react'
import { useStudentById } from '@/features/students/hooks/use-student-by-id'
import { StudentProfileCard } from '@/features/students/components/StudentProfileCard'
import { getDisplayName } from '@/features/students/utils/formatting'

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

      <TileWrapper columns={12} gap={24} mode="grid">
        {/* Left Column: Student Profile Card (22rem width - 25% viewport) */}
        <Tile
          id="profile-card-wrapper"
          widthPx="22rem"
          layoutMode="grid"
          background="card"
          borderRadius="1rem"
          shadowed
          nested
          style={{ padding: '1rem', position: 'relative' }}
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

        {/* Right Column: Other Content (75% width - 9 columns) */}
        <Tile id="content-wrapper" width={9} layoutMode="grid">
          <div className="space-y-6">
            {/* Academic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">GPA</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {student.gpa.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Performance</span>
                    <PerformanceBadge performance={student.performance} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Attendance</span>
                    <AttendanceIndicator value={student.percentage} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder for Calendar, Scholarships, Health Records */}
            <div className="text-center py-12 text-muted-foreground">
              <p>
                Additional content sections (Calendar, Scholarships, Health Records) will be added
                here
              </p>
            </div>
          </div>
        </Tile>
      </TileWrapper>
    </div>
  )
}
