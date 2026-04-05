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
