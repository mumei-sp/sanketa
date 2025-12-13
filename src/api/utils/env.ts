/**
 * Environment variable validation and configuration
 */

interface EnvConfig {
  apiBaseUrl: string
  apiTimeout: number
}

/**
 * Validate and get environment configuration
 * @returns Validated environment configuration
 * @throws Error if required environment variables are invalid
 */
export function validateEnv(): EnvConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT) || 10000

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
