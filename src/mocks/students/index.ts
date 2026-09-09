/**
 * Barrel for student-related mock data.
 * Consumers should import from `@/mocks/students` rather than individual files
 * so renames inside this folder stay internal.
 */
export { studentsData, resetStudentDirectory } from './students'
export { persistStudents } from './store'
export { attendanceOverviewData, enrollmentTrendsData } from './dashboard'
export { studentDetailData } from './details'
export * from './academic-performance'
