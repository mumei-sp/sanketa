import type {
  StudentDetailData,
  StudentAttendanceMonth,
} from '@/features/students/types'
import { relativeDisplay } from '@/mocks/_shared/date-helpers'

/** Key for the current calendar month in the `monthlyAttendance` map ("YYYY-M", M zero-indexed). */
const CURRENT_MONTH_KEY = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}`
})()

/**
 * Mock attendance snapshot for the current calendar month.
 * Uses a fixed pattern (matches Figma reference) regardless of which month
 * the app is viewed in, so the detail view always has plausible data.
 */
const currentMonthAttendance: StudentAttendanceMonth = {
  highlights: [
    // Present days (green) — 14 days
    { date: 3, variant: 'present' },
    { date: 4, variant: 'present' },
    { date: 5, variant: 'present' },
    { date: 7, variant: 'present' },
    { date: 10, variant: 'present' },
    { date: 11, variant: 'present' },
    { date: 12, variant: 'present' },
    { date: 14, variant: 'present' },
    { date: 18, variant: 'present' },
    { date: 19, variant: 'present' },
    { date: 20, variant: 'present' },
    { date: 21, variant: 'present' },
    { date: 22, variant: 'present' },
    { date: 24, variant: 'present' },
    // Late days (orange) — 3 days
    { date: 6, variant: 'late' },
    { date: 8, variant: 'late' },
    { date: 13, variant: 'late' },
    // Absent days (red) — 2 days
    { date: 9, variant: 'absent' },
    { date: 17, variant: 'absent' },
    // Sick days (blue) — 1 day
    { date: 15, variant: 'sick' },
  ],
  summary: {
    present: 14,
    late: 3,
    absent: 2,
    sick: 1,
  },
}

/**
 * Complete mock detail data for student detail page (Isabella Rossi)
 */
export const studentDetailData: StudentDetailData = {
  monthlyAttendance: {
    [CURRENT_MONTH_KEY]: currentMonthAttendance,
  },

  scholarships: [
    {
      id: 'sch-1',
      title: 'Global Young Achievers Award',
      category: 'Finance',
      icon: 'globe',
    },
    {
      id: 'sch-2',
      title: 'STEM for Girls Initiative',
      category: 'Enrichment',
      icon: 'award',
    },
  ],

  healthRecords: [
    {
      id: 'hr-1',
      title: 'Medical Record',
      description: 'Routine health check completed Feb 2025 — Fit for activities',
      severity: 'normal',
    },
    {
      id: 'hr-2',
      title: 'Allergy',
      description: 'Mild pollen allergy — medication required',
      severity: 'mild',
    },
    {
      id: 'hr-3',
      title: 'Peanut Allergy',
      description: 'Severe reaction — strictly avoid exposure, EpiPen required',
      severity: 'severe',
    },
  ],

  extracurriculars: [
    {
      id: 'ec-1',
      club: 'Swimming',
      role: 'Team Member',
      icon: 'Waves',
      achievements: 'Won 2 Silver Medals (City Meet)',
      duration: '2029 – Present',
      advisor: 'Coach Andrea V.',
    },
    {
      id: 'ec-2',
      club: 'Dance',
      role: 'Lead Performer',
      icon: 'Accessibility',
      achievements: 'Performed at National Festival',
      duration: '2030 – Present',
      advisor: 'Ms. Clara F.',
    },
    {
      id: 'ec-3',
      club: 'Robotics',
      role: 'Programmer',
      icon: 'Bot',
      achievements: '1st Place in School Robotics Fair',
      duration: '2033 – Present',
      advisor: 'Mr. Daniel K.',
    },
  ],

  behaviorLog: [
    {
      id: 'bl-1',
      date: relativeDisplay(-90),
      type: 'Positive Note',
      details: 'Helped classmates during group project',
      reportedBy: 'Priya Nair',
      statusAction: 'Record Recognition',
    },
    {
      id: 'bl-2',
      date: relativeDisplay(-60),
      type: 'Positive Note',
      details: 'Volunteered in school event organization',
      reportedBy: 'Admin Office',
      statusAction: 'Recognition Recorded',
    },
    {
      id: 'bl-3',
      date: relativeDisplay(-40),
      type: 'Minor Issue',
      details: 'Late submission of homework',
      reportedBy: 'Aditi Sharma',
      statusAction: 'Issue Warning',
    },
    {
      id: 'bl-4',
      date: relativeDisplay(-15),
      type: 'Minor Issue',
      details: 'Absent without prior notice',
      reportedBy: 'Homeroom Teacher',
      statusAction: 'Parent Notified',
    },
  ],

  documents: [
    {
      id: 'doc-1',
      name: 'ReportCard_IsabellaRossi_Grad8.pdf',
      type: 'PDF',
      size: '4.5 MB',
    },
    {
      id: 'doc-2',
      name: 'Certificate_ScienceFair_Winner.pdf',
      type: 'PDF',
      size: '1.86 MB',
    },
    {
      id: 'doc-3',
      name: 'IDCard_Student_S2106_Isabella.pdf',
      type: 'PDF',
      size: '0.92 MB',
    },
  ],
}
