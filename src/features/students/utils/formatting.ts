import type { Student, Gender } from '../types'

/**
 * Helper function to get gender label from gender code
 */
export function getGenderLabel(gender?: Gender): string {
  switch (gender) {
    case 0:
      return 'Male'
    case 1:
      return 'Female'
    case 2:
      return 'Other'
    case 3:
      return 'Prefer not to say'
    default:
      return 'N/A'
  }
}

/**
 * Helper function to get gender icon symbol from gender code
 */
export function getGenderIcon(gender?: Gender): string {
  switch (gender) {
    case 0:
      return '♂'
    case 1:
      return '♀'
    default:
      return '⚧'
  }
}

/**
 * Helper function to get display name from student
 * Uses displayName, fullName, or constructs from firstName/lastName
 */
export function getDisplayName(student: Student): string {
  if (student.displayName) return student.displayName
  if (student.fullName) return student.fullName
  if (student.name) return student.name

  const parts: string[] = []
  if (student.firstName) parts.push(student.firstName)
  if (student.middleName) parts.push(student.middleName)
  if (student.lastName) parts.push(student.lastName)

  return parts.length > 0 ? parts.join(' ') : 'Unknown'
}

/**
 * Helper function to format date from YYYY-MM-DD to "Month Day, Year"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'N/A'
  }
}

/**
 * Helper function to format phone number with country code
 */
export function formatPhone(phone?: string, countryCode?: string): string {
  if (!phone) return 'N/A'

  const code = countryCode || ''
  return code ? `${code} ${phone}` : phone
}

/**
 * Helper function to get class label from gradeLevel and section
 */
export function getClassLabel(gradeLevel?: string, section?: string): string {
  if (gradeLevel && section) {
    return `Class ${gradeLevel}${section}`
  }
  if (gradeLevel) {
    return `Class ${gradeLevel}`
  }
  return 'N/A'
}
