/**
 * Number & Currency Formatting Utilities
 *
 * Centralised formatters using the Indian numbering system (en-IN).
 * Use these instead of inline toLocaleString() calls to keep formatting consistent.
 */

/** Format a number with Indian grouping: 10,00,000 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN')
}

/** Format currency in INR with Indian grouping: ₹1,00,000 */
export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

/** Extract initials from a full name: "Ravi Kumar" → "RK" */
export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, maxLength)
}

/**
 * Join a dialling code and a number into the one string a record stores.
 *
 * Forms collect the two separately; tables that hold a person rather than a
 * form field keep one `phone`. Both halves of the conversion live here
 * together because they are the pair that drifts: a join that keeps the code
 * and a split that does not is how `+971 501234567` becomes a number nobody
 * can ring.
 */
export function joinPhone(countryCode: string | undefined, number: string | undefined): string | undefined {
  const digits = number?.trim()
  if (!digits) return undefined
  const code = countryCode?.trim()
  // Already carries a code, or none was given: store it as typed.
  if (!code || digits.startsWith('+')) return digits
  return `${code} ${digits}`
}

/**
 * The inverse of `joinPhone`. Defaults to +91, which is what the forms do.
 *
 * A separator is required before the number, because `+919845123457` cannot
 * be split without guessing where the code ends — India is +91, but so is
 * nothing else that starts +9198. Unsplittable values come back whole, in the
 * number field, and `joinPhone` puts them back exactly as they were.
 */
export function splitPhone(phone: string | undefined): { countryCode: string; number: string } {
  const value = phone?.trim() ?? ''
  const match = /^(\+\d{1,4})[\s-]+(.+)$/.exec(value)
  return match ? { countryCode: match[1], number: match[2].trim() } : { countryCode: '+91', number: value }
}
