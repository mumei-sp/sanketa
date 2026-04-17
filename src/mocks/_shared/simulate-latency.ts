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
 * Wait a simulated-network-delay amount, then (optionally) run `producer`.
 *
 * Two call shapes are supported so mock adapters can stay terse:
 *
 *   // a) Plain delay — used when the adapter wants to do its work inline.
 *   await withLatency()
 *   return [...students]
 *
 *   // b) With producer — returns producer()'s value after the delay.
 *   return withLatency(() => ({ data: [...students] }))
 *
 * Both produce the same wire-latency behaviour; pick whichever reads cleanest
 * at the call site. Options (min/max ms) may be supplied in either shape —
 * as the first arg if there's no producer, or as the second arg otherwise.
 */
export function withLatency(options?: LatencyOptions): Promise<void>
export function withLatency<T>(
  producer: () => T | Promise<T>,
  options?: LatencyOptions,
): Promise<T>
export async function withLatency<T>(
  producerOrOptions?: LatencyOptions | (() => T | Promise<T>),
  maybeOptions?: LatencyOptions,
): Promise<T | void> {
  const producer = typeof producerOrOptions === 'function' ? producerOrOptions : undefined
  const options = typeof producerOrOptions === 'function' ? maybeOptions : producerOrOptions
  await simulateLatency(options)
  if (producer) return producer()
}
