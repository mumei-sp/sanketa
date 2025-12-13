import type { ApiError } from '../types'

/**
 * Handle and normalize API errors
 * Converts unknown error types to a standardized ApiError format
 * @param error Unknown error object
 * @returns Normalized ApiError object
 */
export function handleApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'code' in error) {
    return error as ApiError
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    status: 0,
  }
}

/**
 * Extract error message from an unknown error
 * @param error Unknown error object
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  const apiError = handleApiError(error)
  return apiError.message
}

