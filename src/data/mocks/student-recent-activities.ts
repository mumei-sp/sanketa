/** Mock data for Recent Activities widget on Students page */

export type ActivityType = 'enrollment' | 'grade' | 'attendance' | 'promotion' | 'transfer'

export interface RecentActivityEntry {
  id: string
  type: ActivityType
  studentName: string
  classLabel: string
  description: string
  /** Relative time string */
  timeAgo: string
}

export const recentActivitiesData: RecentActivityEntry[] = [
  {
    id: 'ra-1',
    type: 'enrollment',
    studentName: 'Aisha Patel',
    classLabel: '7A',
    description: 'New student enrolled',
    timeAgo: '2 hours ago',
  },
  {
    id: 'ra-2',
    type: 'grade',
    studentName: 'Michael Chen',
    classLabel: '7A',
    description: 'Grade updated to A+',
    timeAgo: '4 hours ago',
  },
  {
    id: 'ra-3',
    type: 'attendance',
    studentName: 'Emma Williams',
    classLabel: '7B',
    description: 'Marked absent today',
    timeAgo: '5 hours ago',
  },
  {
    id: 'ra-4',
    type: 'promotion',
    studentName: 'Rajesh Kumar',
    classLabel: '7C',
    description: 'Promoted to Grade 8',
    timeAgo: '1 day ago',
  },
  {
    id: 'ra-5',
    type: 'transfer',
    studentName: 'Hannah Lee',
    classLabel: '8A',
    description: 'Transferred to 8B',
    timeAgo: '2 days ago',
  },
]
