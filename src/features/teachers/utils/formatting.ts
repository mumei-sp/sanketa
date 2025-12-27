import type { Teacher } from '../types'

/**
 * Helper function to get display name from teacher
 * Uses displayName, fullName, or constructs from firstName/lastName
 */
export function getDisplayName(teacher: Teacher): string {
  if (teacher.displayName) return teacher.displayName
  if (teacher.fullName) return teacher.fullName
  if (teacher.name) return teacher.name

  const parts: string[] = []
  if (teacher.firstName) parts.push(teacher.firstName)
  if (teacher.middleName) parts.push(teacher.middleName)
  if (teacher.lastName) parts.push(teacher.lastName)

  return parts.length > 0 ? parts.join(' ') : 'Unknown'
}

/**
 * Helper function to format phone number
 * Formats Indonesian phone numbers with +62 prefix
 */
export function formatPhone(phone?: string): string {
  if (!phone) return 'N/A'

  // If phone already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone
  }

  // Format Indonesian phone numbers (add +62 if not present)
  if (phone.startsWith('62')) {
    return `+${phone}`
  }

  // If phone starts with 0, replace with +62
  if (phone.startsWith('0')) {
    return `+62 ${phone.slice(1)}`
  }

  // If phone starts with 8 (common Indonesian mobile), add +62
  if (phone.startsWith('8')) {
    return `+62 ${phone}`
  }

  // Otherwise, add +62 prefix
  return `+62 ${phone}`
}

