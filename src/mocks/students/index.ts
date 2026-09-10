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
export * from './academic-performance'
// `./details` is deliberately not re-exported. It reads the class registers to
// build a student's attendance calendar, and the registers are built from this
// barrel — routing it through here would make the barrel import itself, with
// module evaluation order deciding whether it worked. The one caller imports
// the file.
