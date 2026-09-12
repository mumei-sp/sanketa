/**
 * A deterministic random source for the seed generators.
 *
 * Fixtures are generated rather than typed out, which is only tolerable if
 * two runs produce the same school. `Math.random()` would make the roster
 * different on every reload: the student you were looking at would be
 * somebody else after a refresh, the store's fixture fingerprint would change
 * every time and reseed, and a screenshot would never reproduce. So the
 * generator carries its own stream, seeded from a string.
 *
 * mulberry32 — thirty lines of arithmetic, good enough for names and marks,
 * and small enough to read. Nothing here is security-relevant.
 */

/** A pull from the stream: 0 ≤ n < 1, like `Math.random`. */
export type Rng = () => number

/** Hash a string into a 32-bit seed, so streams can be named. */
function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * A named stream.
 *
 * Name them after what they generate — `rng('kendriya:roster')` — so adding a
 * generator for one thing does not shift the output of another. Two streams
 * off one seed would mean inserting a name pick in the middle re-rolls every
 * mark in the school.
 */
export function rng(seed: string): Rng {
  let state = hashSeed(seed)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** An integer in `[min, max]`, both ends included. */
export function int(source: Rng, min: number, max: number): number {
  return min + Math.floor(source() * (max - min + 1))
}

/** One item. Empty lists are a caller bug, so this throws rather than undefined. */
export function pick<T>(source: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() from an empty list')
  return items[Math.floor(source() * items.length)]
}

/** True with probability `p`. */
export function chance(source: Rng, p: number): boolean {
  return source() < p
}

/**
 * One item, respecting weights.
 *
 * Communities are not equally represented in a Bangalore classroom, and a
 * uniform pick would put as many Bengali surnames in the register as Kannada
 * ones — which is the kind of wrong that looks fine until somebody who lives
 * there reads it.
 */
export function weighted<T extends { weight: number }>(source: Rng, items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = source() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item
  }
  return items[items.length - 1]
}

/**
 * A value clustered around the middle of a range rather than flat across it.
 *
 * Three pulls averaged, which is a crude normal. Marks, ages and class sizes
 * all bunch; a uniform draw gives a class where as many students score 34 as
 * score 70, and every chart built on it looks like noise.
 */
export function bell(source: Rng, min: number, max: number): number {
  const average = (source() + source() + source()) / 3
  return min + average * (max - min)
}
