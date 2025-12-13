/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * API Error response
 */
export interface ApiError {
  code: string
  message: string
  status: number
  details?: Record<string, string[]>
}

/**
 * Query parameter interfaces for common API patterns
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SearchParams {
  search?: string
}

export interface SortParams {
  sort?: string
  order?: 'asc' | 'desc'
}

/**
 * API Client configuration
 */
export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  enableRequestId?: boolean
  onUnauthorized?: () => void | Promise<void>
  onError?: (error: ApiError) => void
  retryConfig?: RetryConfig
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  retries: number
  retryDelay: number
  retryCondition?: (error: ApiError) => boolean
}

/**
 * Request configuration for cancellation and additional options
 */
export interface RequestConfig {
  signal?: AbortSignal
  [key: string]: unknown
}
