/**
 * What the palette can find, and how well a query matches it.
 *
 * Kept apart from the component so the ranking is testable on its own and the
 * component stays about presentation.
 */

import type { LucideIcon } from 'lucide-react'

export type ResultGroup = 'Actions' | 'Go to' | 'Students' | 'Teachers' | 'Notices'

export interface SearchItem {
  id: string
  label: string
  /** Second line — id, class, subject, audience. Also searched. */
  detail?: string
  route: string
  group: ResultGroup
  /** Overrides the group's default glyph, for actions that want their own. */
  icon?: LucideIcon
  /** Nudges genuinely common destinations above incidental matches. */
  weight?: number
}

export interface ScoredItem extends SearchItem {
  score: number
  /** Indices into `label` that matched, for highlighting. */
  matches: number[]
}

/**
 * Score one candidate against a lowercased query.
 *
 * Three tiers, because a palette that ranks by "contains" makes you type the
 * whole word before the thing you wanted reaches the top:
 *
 *   exact prefix        "grade" → "Grade Sheet"        — highest
 *   word-start match    "sheet" → "Grade Sheet"
 *   subsequence         "gsh"   → "Grade Sheet"        — lowest, but present
 *
 * Shorter labels win ties, so "Grades" beats "Grade Sheet" for "grade": the
 * more specific a label is, the more of it you had to not type.
 *
 * Returns null when the query cannot be found in the label at all — `detail`
 * is checked separately by the caller so an id match never outranks a name.
 */
function scoreLabel(label: string, query: string): { score: number; matches: number[] } | null {
  const haystack = label.toLowerCase()

  if (haystack.startsWith(query)) {
    return {
      score: 1000 - label.length,
      matches: Array.from({ length: query.length }, (_, i) => i),
    }
  }

  // Word starts — "sheet" should find "Grade Sheet", and "ver" "Ananya Verma".
  const wordStart = haystack.indexOf(query, 0)
  if (wordStart > 0 && /[\s\-–—·/]/.test(haystack[wordStart - 1])) {
    return {
      score: 800 - label.length,
      matches: Array.from({ length: query.length }, (_, i) => wordStart + i),
    }
  }

  if (wordStart > 0) {
    return {
      score: 600 - label.length,
      matches: Array.from({ length: query.length }, (_, i) => wordStart + i),
    }
  }

  // Subsequence: every query character in order, not necessarily adjacent.
  // Runs of adjacent hits score better, so "grsh" prefers "Grade Sheet" over a
  // label where those letters happen to be scattered.
  const matches: number[] = []
  let cursor = 0
  let adjacency = 0
  for (const char of query) {
    const found = haystack.indexOf(char, cursor)
    if (found === -1) return null
    if (found === cursor && matches.length > 0) adjacency += 1
    matches.push(found)
    cursor = found + 1
  }
  return { score: 300 + adjacency * 10 - label.length, matches }
}

/** Rank the pool against a query, best first. */
export function rankItems(pool: SearchItem[], rawQuery: string, limit: number): ScoredItem[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const scored: ScoredItem[] = []
  for (const item of pool) {
    const onLabel = scoreLabel(item.label, query)
    if (onLabel) {
      scored.push({ ...item, score: onLabel.score + (item.weight ?? 0), matches: onLabel.matches })
      continue
    }
    // A hit in the detail line still counts, but never outranks a name match —
    // searching "7A" should surface that class's students below anyone whose
    // name actually contains it.
    if (item.detail && item.detail.toLowerCase().includes(query)) {
      scored.push({ ...item, score: 100 + (item.weight ?? 0), matches: [] })
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Split a label into matched / unmatched runs for highlighting. */
export function highlightParts(
  label: string,
  matches: number[],
): { text: string; hit: boolean }[] {
  if (matches.length === 0) return [{ text: label, hit: false }]

  const hits = new Set(matches)
  const parts: { text: string; hit: boolean }[] = []
  let buffer = ''
  let bufferHit = hits.has(0)

  for (let index = 0; index < label.length; index += 1) {
    const isHit = hits.has(index)
    if (isHit !== bufferHit) {
      if (buffer) parts.push({ text: buffer, hit: bufferHit })
      buffer = ''
      bufferHit = isHit
    }
    buffer += label[index]
  }
  if (buffer) parts.push({ text: buffer, hit: bufferHit })
  return parts
}

// ── Recents ───────────────────────────────────────────────────────────

const RECENTS_KEY = 'sanketa:search-recents'
const RECENTS_LIMIT = 5

/**
 * The last few things opened from the palette.
 *
 * Stored rather than derived because "what I opened from search" is not the
 * same as browser history — it is the shortlist someone keeps returning to,
 * and it is what makes an empty palette useful instead of a blank box.
 */
export function readRecents(): SearchItem[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SearchItem[]) : []
  } catch {
    return []
  }
}

export function rememberRecent(item: SearchItem): SearchItem[] {
  // Actions are shortcuts, not destinations — remembering "Add student"
  // crowds out the records someone actually keeps coming back to.
  if (item.group === 'Actions') return readRecents()

  const next = [item, ...readRecents().filter(existing => existing.id !== item.id)].slice(
    0,
    RECENTS_LIMIT,
  )
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch {
    // Private mode or quota — recents are a convenience, never a requirement.
  }
  return next
}
