import type { PaginationParams, SearchParams, SortParams } from '../types'

export interface QueryParams extends PaginationParams, SearchParams, SortParams {
  [key: string]: unknown
}

/**
 * Build query parameters object from various parameter types
 * Filters out undefined/null values and converts to string/number format
 * @param params Object containing pagination, search, sort, and custom parameters
 * @returns Cleaned query parameters object suitable for URL encoding
 */
export function buildQueryParams(
  params?: PaginationParams & SearchParams & SortParams & Record<string, unknown>,
): Record<string, string | number> {
  if (!params) return {}

  const queryParams: Record<string, string | number> = {}

  if (params.page !== undefined) {
    queryParams.page = params.page
  }

  if (params.limit !== undefined) {
    queryParams.limit = params.limit
  }

  if (params.search) {
    queryParams.search = params.search
  }

  if (params.sort) {
    queryParams.sort = params.sort
  }

  if (params.order) {
    queryParams.order = params.order
  }

  // Add any additional custom parameters
  Object.keys(params).forEach(key => {
    if (!['page', 'limit', 'search', 'sort', 'order'].includes(key)) {
      const value = params[key]
      if (value !== undefined && value !== null) {
        queryParams[key] = String(value)
      }
    }
  })

  return queryParams
}
