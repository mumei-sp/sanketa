import { MoreHorizontal, Mail, Phone, MapPin, Cake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { InfoRow } from '@/components/ui/info-row'
import { spacing } from '@/config/spacing'
import type { TeacherDetail } from '../types/teacher-detail'
import { formatPhone } from '../utils/formatting'

interface TeacherPersonalInfoProps {
  teacher: TeacherDetail
}

function getGenderIcon(gender?: number) {
  if (gender === 1) return '♀'
  if (gender === 0) return '♂'
  return '⚧'
}

function getGenderLabel(gender?: number) {
  if (gender === 0) return 'Male'
  if (gender === 1) return 'Female'
  if (gender === 2) return 'Other'
  return 'N/A'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * TeacherPersonalInfo - Displays personal details using shared InfoRow component
 */
export function TeacherPersonalInfo({ teacher }: TeacherPersonalInfoProps) {
  return (
    <SectionCard
      title="Personal Info"
      action={
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
        <InfoRow
          icon={<span>{getGenderIcon(teacher.gender)}</span>}
          label="Gender"
          value={getGenderLabel(teacher.gender)}
        />
        <InfoRow
          icon={<Cake className="w-4 h-4 text-muted-foreground" />}
          label="Date of Birth"
          value={formatDate(teacher.dateOfBirth)}
        />
        <InfoRow
          icon={<Mail className="w-4 h-4 text-muted-foreground" />}
          label="Email Address"
          value={teacher.email}
        />
        <InfoRow
          icon={<Phone className="w-4 h-4 text-muted-foreground" />}
          label="Phone Number"
          value={formatPhone(teacher.primaryPhone)}
        />
        <InfoRow
          icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
          label="Address"
          value={teacher.address || 'N/A'}
        />
      </div>
    </SectionCard>
  )
}
