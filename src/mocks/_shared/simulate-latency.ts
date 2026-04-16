/**
 * Shared latency helper for mock adapters.
 *
 * Every mock service used to inline `Math.random() * range + min` + setTimeout.
 * This helper centralises that so bumping the fake latency (e.g. for testing
 * spinners) is a one-line change.
 */

export interface LatencyOptions {
  /** Minimum delay in ms. Default 200. */
  min?: number
  /** Maximum delay in ms. Default 600. */
  max?: number
}

/**
 * Resolve after a random delay within `[min, max]` ms. Defaults produce 200–600ms
 * latency, realistic for a regional API over 4G without feeling sluggish.
 */
export function simulateLatency(options: LatencyOptions = {}): Promise<void> {
  const { min = 200, max = 600 } = options
  const span = Math.max(0, max - min)
  const delay = Math.round(Math.random() * span + min)
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Thin wrapper that runs `producer()` after a simulated delay and resolves
 * with its return value. Keeps mock adapter bodies tiny:
 *
 *   return withLatency(() => ({ data: [...students], pagination: ... }))
 */
export async function withLatency<T>(
  producer: () => T | Promise<T>,
  options?: LatencyOptions,
): Promise<T> {
  await simulateLatency(options)
  return producer()
}
