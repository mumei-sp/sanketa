import { GraduationCap, Users, UserCog, Award } from 'lucide-react'
import { baseColors, status } from '@/theme/colors'
import type {
  DashboardStat,
  PerformanceDataset,
  EarningsDataset,
  GenderDataset,
  AttendanceDataset,
  CalendarEvent,
  TodoItem,
  RecentActivityItem,
} from '../types'

export const dashboardStats: DashboardStat[] = [
  {
    id: 'enrolled-students',
    label: 'Enrolled Students',
    value: 1245,
    icon: GraduationCap,
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
  {
    id: 'active-teachers',
    label: 'Active Teachers',
    value: 86,
    icon: Users,
    iconBg: baseColors.blue,
    iconColor: baseColors.heading,
  },
  {
    id: 'support-staff',
    label: 'Support Staff',
    value: 34,
    icon: UserCog,
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
  {
    id: 'total-awards',
    label: 'Total Awards',
    value: 152,
    icon: Award,
    iconBg: baseColors.blue,
    iconColor: baseColors.heading,
  },
]

export const performanceDatasets: PerformanceDataset[] = [
  {
    label: 'Last Semester',
    value: 'last-semester',
    grades: [
      { key: 'grade7', label: 'Grade 7', color: baseColors.blue },
      { key: 'grade8', label: 'Grade 8', color: baseColors.pink },
      { key: 'grade9', label: 'Grade 9', color: baseColors.heading },
    ],
    data: [
      { month: 'May', grade7: 65, grade8: 70, grade9: 82 },
      { month: 'Jun', grade7: 55, grade8: 60, grade9: 97 },
      { month: 'Jul', grade7: 45, grade8: 40, grade9: 60 },
      { month: 'Aug', grade7: 75, grade8: 85, grade9: 78 },
      { month: 'Sep', grade7: 52, grade8: 56, grade9: 60 },
    ],
  },
  {
    label: 'Current',
    value: 'current',
    grades: [
      { key: 'grade7', label: 'Grade 7', color: baseColors.blue },
      { key: 'grade8', label: 'Grade 8', color: baseColors.pink },
      { key: 'grade9', label: 'Grade 9', color: baseColors.heading },
    ],
    data: [
      { month: 'Oct', grade7: 70, grade8: 75, grade9: 88 },
      { month: 'Nov', grade7: 68, grade8: 72, grade9: 85 },
      { month: 'Dec', grade7: 74, grade8: 78, grade9: 90 },
      { month: 'Jan', grade7: 62, grade8: 68, grade9: 82 },
      { month: 'Feb', grade7: 76, grade8: 80, grade9: 92 },
      { month: 'Mar', grade7: 71, grade8: 77, grade9: 87 },
    ],
  },
]

export const earningsDatasets: EarningsDataset[] = [
  {
    label: 'Last Year',
    value: 'last-year',
    data: [
      { month: 'Jan', earnings: 5200, expenses: 3400 },
      { month: 'Feb', earnings: 4800, expenses: 3100 },
      { month: 'Mar', earnings: 5100, expenses: 3500 },
      { month: 'Apr', earnings: 3800, expenses: 3000 },
      { month: 'May', earnings: 5600, expenses: 3200 },
      { month: 'Jun', earnings: 4200, expenses: 3800 },
      { month: 'Jul', earnings: 5500, expenses: 3100 },
      { month: 'Aug', earnings: 4600, expenses: 2900 },
    ],
  },
  {
    label: 'This Year',
    value: 'this-year',
    data: [
      { month: 'Jan', earnings: 5800, expenses: 3600 },
      { month: 'Feb', earnings: 5200, expenses: 3300 },
      { month: 'Mar', earnings: 5900, expenses: 3700 },
      { month: 'Apr', earnings: 4500, expenses: 3200 },
      { month: 'May', earnings: 6100, expenses: 3500 },
      { month: 'Jun', earnings: 4800, expenses: 4000 },
      { month: 'Jul', earnings: 6200, expenses: 3400 },
      { month: 'Aug', earnings: 5100, expenses: 3100 },
      { month: 'Sep', earnings: 5700, expenses: 3800 },
      { month: 'Oct', earnings: 6400, expenses: 3900 },
      { month: 'Nov', earnings: 5500, expenses: 3600 },
      { month: 'Dec', earnings: 6800, expenses: 4200 },
    ],
  },
]

export const genderDatasets: GenderDataset[] = [
  {
    label: 'Grade 9',
    value: 'grade-9',
    data: [
      { label: 'Boys', value: 560, color: baseColors.heading },
      { label: 'Girls', value: 685, color: baseColors.pink },
    ],
  },
  {
    label: 'Grade 8',
    value: 'grade-8',
    data: [
      { label: 'Boys', value: 420, color: baseColors.heading },
      { label: 'Girls', value: 390, color: baseColors.pink },
    ],
  },
  {
    label: 'Grade 7',
    value: 'grade-7',
    data: [
      { label: 'Boys', value: 310, color: baseColors.heading },
      { label: 'Girls', value: 345, color: baseColors.pink },
    ],
  },
]

export const attendanceDatasets: AttendanceDataset[] = [
  {
    label: 'Weekly',
    value: 'weekly',
    data: [
      { day: 'Mon', count: 1243 },
      { day: 'Tue', count: 1051 },
      { day: 'Wed', count: 1190 },
      { day: 'Thu', count: 1100 },
      { day: 'Fri', count: 1245 },
    ],
  },
  {
    label: 'Monthly',
    value: 'monthly',
    data: [
      { day: 'Week 1', count: 5829 },
      { day: 'Week 2', count: 5540 },
      { day: 'Week 3', count: 5915 },
      { day: 'Week 4', count: 5210 },
    ],
  },
]

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'evt-1',
    date: 'March 2',
    startTime: '05:02 AM',
    endTime: '12:00 PM',
    title: 'Annual Sport Competition',
    subtitle: 'All Classes',
    color: status.danger.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-2',
    date: 'March 5',
    startTime: '02:00 PM',
    endTime: '01:55 PM',
    title: 'Parent-Teacher Meeting',
    subtitle: 'Gr. 3A, 5B',
    color: status.info.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-3',
    date: 'March 28',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    title: 'Annual Science Fair',
    subtitle: 'All Classes',
    color: status.warning.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-4',
    date: 'April 10',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    title: 'Inter-School Debate',
    subtitle: 'Grade 8 & 9',
    color: status.info.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-5',
    date: 'April 22',
    startTime: '08:00 AM',
    endTime: '03:00 PM',
    title: 'Earth Day Celebration',
    subtitle: 'All Classes',
    color: status.success.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-6',
    date: 'February 14',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    title: 'Art Exhibition',
    subtitle: 'All Classes',
    color: status.warning.base,
    bgColor: baseColors.pink,
  },
]

export const todoItems: TodoItem[] = [
  {
    id: 'todo-1',
    text: 'Review Teacher Attendance Records',
    date: 'March 11, 2035',
    completed: true,
  },
  {
    id: 'todo-2',
    text: 'Prepare Science Fair Guidelines',
    date: 'March 13, 2035',
    completed: false,
  },
  {
    id: 'todo-3',
    text: 'Update Library Book Inventory',
    date: 'March 14, 2035',
    completed: false,
  },
]

export const recentActivityItems: RecentActivityItem[] = [
  {
    id: 'act-1',
    text: 'New student Alicia Gomez (Class 8B) enrolled by Registrar.',
    timestamp: 'March 7, 2035 – 09:15 AM',
    dotColor: status.info.base,
    icon: 'user-plus',
    iconBg: baseColors.blue,
    iconColor: baseColors.heading,
  },
  {
    id: 'act-2',
    text: 'Attendance for Class 7A marked by Teacher John Smith.',
    timestamp: 'March 7, 2035 – 11:30 AM',
    dotColor: status.success.base,
    icon: 'check-square',
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
  {
    id: 'act-3',
    text: 'Monthly fee payments verified for Grade 9 students.',
    timestamp: 'March 8, 2035 – 02:45 PM',
    dotColor: status.warning.base,
    icon: 'receipt',
    iconBg: baseColors.heading,
    iconColor: '#FFFFFF',
  },
  {
    id: 'act-4',
    text: 'Exam timetable for Term 2 updated by Academic Coordinator.',
    timestamp: 'March 9, 2035 – 10:20 AM',
    dotColor: status.danger.base,
    icon: 'pencil',
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
]
