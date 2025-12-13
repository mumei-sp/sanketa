/**
 * API Package Barrel Export
 * Central export point for all API-related types and utilities
 */

// Client
export { default as apiClient, configureApiClient } from './client'

// Types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  PaginationParams,
  SearchParams,
  SortParams,
  ApiClientConfig,
  RetryConfig,
  RequestConfig,
} from './types'

// Utils
export { authUtils } from './utils/auth'
export { errorEmitter } from './utils/error-emitter'
export { handleApiError, getErrorMessage } from './utils/error-handler'
export { buildQueryParams } from './utils/query-params'
export type { QueryParams } from './utils/query-params'
