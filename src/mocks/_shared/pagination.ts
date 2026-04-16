/**
 * Pagination helper for mock list adapters.
 *
 * Wraps any `T[]` in the project-wide `PaginatedResponse<T>` envelope given
 * simple pagination params. Keeps adapter code declarative:
 *
 *   return paginate(students, params)
 *
 * Matches the shape expected in `src/api/types.ts` so consumers can trust the
 * same envelope regardless of mock vs real backend.
 */

import type { PaginatedResponse, PaginationParams } from '@/api/types'

export interface PaginateOptions extends PaginationParams {
  /** Default page size when the caller omits `limit`. */
  defaultLimit?: number
}

export function paginate<T>(items: readonly T[], opts: PaginateOptions = {}): PaginatedResponse<T> {
  const { page = 1, limit = opts.defaultLimit ?? 20 } = opts
  const safeLimit = Math.max(1, Math.floor(limit))
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages)
  const start = (safePage - 1) * safeLimit
  const end = start + safeLimit
  return {
    data: items.slice(start, end),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  }
}

/**
 * Shortcut for "give me everything, no pagination" — still in envelope shape
 * so consumers read the same structure everywhere.
 */
export function paginateAll<T>(items: readonly T[]): PaginatedResponse<T> {
  return {
    data: [...items],
    pagination: {
      page: 1,
      limit: items.length || 1,
      total: items.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  }
}
