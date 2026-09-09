/**
 * Barrel for student-related mock data.
 * Consumers should import from `@/mocks/students` rather than individual files
 * so renames inside this folder stay internal.
 */
export {
  listStudents,
  studentCount,
  findStudent,
  findStudentByCode,
  insertStudent,
  replaceStudent,
  patchStudents,
  resetStudents,
} from './store'
export { attendanceOverviewData, enrollmentTrendsData } from './dashboard'
export { studentDetailData } from './details'
export * from './academic-performance'
