import type { Teacher } from '../types'
import { PHONE_COUNTRY_CODE } from '@/mocks/_shared/constants'

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
 * Format a bare phone number for display.
 *
 * Accepts either:
 *   - an already-formatted string with a leading '+<country>' prefix
 *   - a bare 10-digit number (assumed Indian)
 *   - a number with leading 0 (strip it, then prefix +91)
 *
 * Returns "N/A" when input is undefined/empty.
 */
export function formatPhone(phone?: string): string {
  if (!phone) return 'N/A'

  // Already prefixed? leave untouched.
  if (phone.startsWith('+')) return phone

  // Explicit "91…" without the '+'.
  if (phone.startsWith('91') && phone.length === 12) return `+${phone}`

  // Leading-zero local format → strip the zero and prefix country code.
  if (phone.startsWith('0')) return `${PHONE_COUNTRY_CODE} ${phone.slice(1)}`

  // Bare 10-digit Indian mobile number.
  return `${PHONE_COUNTRY_CODE} ${phone}`
}
