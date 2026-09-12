/**
 * Barrel for `academic-mgmt` — the school's years, terms, grades, sections
 * and subjects.
 */

export {
  currentYear,
  listTerms,
  currentTerm,
  listGradeLevels,
  listSections,
  findSection,
  findSectionByLabel,
  labelOf,
  listSubjects,
  curriculumFor,
  sectionsAsConfig,
  subjectsAsConfig,
  replaceSections,
  replaceSubjects,
  setClassTeacher,
} from './store'
export type * from './types'
