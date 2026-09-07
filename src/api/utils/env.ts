/**
 * Environment variable validation and configuration
 */

interface EnvConfig {
  apiBaseUrl: string
  apiTimeout: number
  /**
   * When true, service modules route through in-memory mock adapters.
   * When false, they call the real backend via axios.
   * Default: true. Flip to false by setting VITE_USE_MOCK_API=false in .env.local.
   */
  useMockApi: boolean
  /**
   * How notifications reach the client.
   *
   * 'sse'  — the server pushes over an EventSource; the client still runs a
   *          `?since=` reconciliation fetch on connect, reconnect and focus,
   *          because a push channel silently loses anything sent while the tab
   *          was asleep or the connection was down.
   * 'poll' — the client asks for `?since=` on a timer. No infrastructure, and
   *          the fallback when a stream is unavailable.
   *
   * Default: 'sse'. Set VITE_NOTIFICATION_TRANSPORT=poll to switch.
   */
  notificationTransport: 'sse' | 'poll'
}

/**
 * Validate and get environment configuration
 * @returns Validated environment configuration
 * @throws Error if required environment variables are invalid
 */
export function validateEnv(): EnvConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT) || 10000
  // Default to mock API unless explicitly disabled. We treat only the literal
  // string 'false' as opt-out so accidental values (undefined, '0', '') don't
  // surprise anyone trying to develop against the mocks.
  const useMockApi = String(import.meta.env.VITE_USE_MOCK_API ?? 'true').toLowerCase() !== 'false'
  // Only the literal 'poll' opts out of push, so a typo falls back to the
  // richer transport rather than silently degrading to a timer.
  const notificationTransport =
    String(import.meta.env.VITE_NOTIFICATION_TRANSPORT ?? 'sse').toLowerCase() === 'poll'
      ? 'poll'
      : 'sse'

  if (isNaN(apiTimeout) || apiTimeout <= 0) {
    console.warn(
      `Invalid VITE_API_TIMEOUT: ${import.meta.env.VITE_API_TIMEOUT}. Using default: 10000ms`,
    )
  }

  // Validate base URL format (basic check)
  if (typeof apiBaseUrl !== 'string' || apiBaseUrl.trim() === '') {
    throw new Error('VITE_API_BASE_URL must be a non-empty string')
  }

  return {
    apiBaseUrl: apiBaseUrl.trim(),
    apiTimeout: apiTimeout > 0 ? apiTimeout : 10000,
    useMockApi,
    notificationTransport,
  }
}

/**
 * Get validated environment configuration
 * Validates on first call and caches result
 */
let cachedConfig: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv()
  }
  return cachedConfig
}
