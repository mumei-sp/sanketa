/**
 * Generic API Response wrapper used by every service that returns a single
 * resource (or a command-style result). When migrating to the real backend,
 * the server is expected to respond with this shape on 2xx:
 *
 *   { "data": { ... }, "status": "success", "message"?: "…" }
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

/**
 * Pagination metadata attached to every list response. The shape mirrors what
 * the REST backend is planned to emit so the frontend can read a single envelope
 * regardless of whether it comes from a mock adapter or an HTTP adapter.
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Paginated API response — used by every list endpoint (`GET /students`,
 * `GET /teachers`, …). Keeps the `pagination` key separate from `data` so
 * consumers can destructure without ambiguity.
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Alias for readability at call sites: `ApiListResponse<Student>` reads more
 * naturally than `PaginatedResponse<Student>` in places where pagination is
 * an implementation detail rather than the focus.
 */
export type ApiListResponse<T> = PaginatedResponse<T>

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
 * Convenience union covering the typical list-query surface: pagination +
 * search + sort. Individual services can narrow this further via intersection
 * with their own filter types, e.g. `ListParams & { status?: StudentStatus }`.
 */
export type ListParams = PaginationParams & SearchParams & SortParams

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
