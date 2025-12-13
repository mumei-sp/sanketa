import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiClientConfig, ApiError, RetryConfig } from './types'
import { authUtils } from './utils/auth'
import { errorEmitter } from './utils/error-emitter'
import { getEnvConfig } from './utils/env'

// Validate and get environment configuration
const envConfig = getEnvConfig()

// Default configuration
const defaultConfig: Required<ApiClientConfig> = {
  baseURL: envConfig.apiBaseUrl,
  timeout: envConfig.apiTimeout,
  enableRequestId: true,
  onUnauthorized: () => {
    // Default: redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },
  onError: (error: ApiError) => {
    errorEmitter.emit(error)
  },
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error: ApiError) => {
      return (
        error.status === 0 ||
        error.status >= 500 ||
        error.status === 429 ||
        error.code === 'NETWORK_ERROR'
      )
    },
  },
}

// Client configuration (can be overridden)
let clientConfig: Required<ApiClientConfig> = { ...defaultConfig }

// Track retry attempts for each request
const retryCounts = new Map<string, number>()

// TODO: When token refresh is implemented in auth.ts, add:
// - refreshTokenPromise tracking
// - retryingRequests WeakSet for preventing duplicate refresh attempts

/**
 * Configure the API client
 * @param config Partial configuration to override defaults
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
  clientConfig = {
    ...clientConfig,
    ...config,
    retryConfig: {
      ...clientConfig.retryConfig,
      ...(config.retryConfig || {}),
    },
  }
}

/**
 * Get a unique request identifier
 */
function getRequestId(config: InternalAxiosRequestConfig): string {
  return (config.headers?.['X-Request-ID'] as string) || crypto.randomUUID()
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if request should be retried
 */
function shouldRetry(error: ApiError, requestId: string, retryConfig: RetryConfig): boolean {
  const retryCount = retryCounts.get(requestId) || 0
  if (retryCount >= retryConfig.retries) {
    return false
  }
  return retryConfig.retryCondition ? retryConfig.retryCondition(error) : false
}

/**
 * Retry a failed request
 */
async function retryRequest(originalRequest: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const requestId = getRequestId(originalRequest)
  const retryCount = (retryCounts.get(requestId) || 0) + 1
  retryCounts.set(requestId, retryCount)

  const retryConfig = clientConfig.retryConfig
  const delay = retryConfig.retryDelay * retryCount // Exponential backoff

  await sleep(delay)

  const token = authUtils.getToken()
  if (token && originalRequest.headers) {
    originalRequest.headers.Authorization = `Bearer ${token}`
  }

  return apiClient.request(originalRequest)
}

// Axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: clientConfig.baseURL,
  timeout: clientConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authUtils.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (clientConfig.enableRequestId && !config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = crypto.randomUUID()
    }

    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// Response interceptor with type safety
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const requestId = response.config.headers?.['X-Request-ID'] as string
    if (requestId) {
      retryCounts.delete(requestId)
    }

    // Return response with data property for convenience, but preserve full response structure
    // This maintains type safety while providing convenient access to response.data
    return response.data !== undefined ? response.data : response
  },
  async error => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined

    let apiError: ApiError
    if (error.response) {
      apiError = {
        code: error.response.data?.code || 'UNKNOWN_ERROR',
        message: error.response.data?.message || error.message,
        status: error.response.status,
        details: error.response.data?.details,
      }

      // Handle 401 Unauthorized
      // TODO: Implement token refresh mechanism in auth.ts
      if (error.response.status === 401) {
        authUtils.removeToken()
        await clientConfig.onUnauthorized()
        return Promise.reject(apiError)
      }

      // Handle other status codes
      switch (error.response.status) {
        case 403:
          // Forbidden
          apiError.message = apiError.message || 'Access denied'
          break
        case 404:
          // Not found
          apiError.message = apiError.message || 'Resource not found'
          break
        case 422:
          // Validation error
          apiError.message = apiError.message || 'Validation failed'
          break
        case 429:
          // Rate limiting
          apiError.message = apiError.message || 'Too many requests. Please try again later.'
          break
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          apiError.message = apiError.message || 'Server error occurred'
          break
      }

      clientConfig.onError(apiError)

      if (
        originalRequest &&
        shouldRetry(apiError, getRequestId(originalRequest), clientConfig.retryConfig)
      ) {
        try {
          return await retryRequest(originalRequest)
        } catch {
          return Promise.reject(apiError)
        }
      }

      return Promise.reject(apiError)
    } else if (error.request) {
      // Request made but no response received (network error)
      apiError = {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        status: 0,
      }

      clientConfig.onError(apiError)

      if (
        originalRequest &&
        shouldRetry(apiError, getRequestId(originalRequest), clientConfig.retryConfig)
      ) {
        try {
          return await retryRequest(originalRequest)
        } catch {
          return Promise.reject(apiError)
        }
      }

      return Promise.reject(apiError)
    } else {
      apiError = {
        code: 'REQUEST_ERROR',
        message: error.message || 'An error occurred while setting up the request',
        status: 0,
      }

      clientConfig.onError(apiError)
      return Promise.reject(apiError)
    }
  },
)

export default apiClient
