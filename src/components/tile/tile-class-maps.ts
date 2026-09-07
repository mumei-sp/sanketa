/** Tailwind breakpoint keys */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Responsive value: plain value (all breakpoints) or object with breakpoint overrides.
 * Example: { default: 12, md: 8, lg: 6 } → "col-span-12 md:col-span-8 lg:col-span-6"
 *
 * `default` is optional so a constraint can start at a breakpoint rather than
 * at the base. That matters for grid placement: forcing `{ default: 1 }` onto
 * `rowStart`/`rowEnd` just to satisfy the type stacks every tile into row 1 on
 * mobile, which collapses them on top of one another. Write `{ lg: 2 }` when a
 * value should only apply from `lg` up.
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint | 'default', T>>

// ── Col-span (Tile width in grid mode) ──────────────────────────────────

const colSpanMap: Record<number, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
  5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
  9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
}

const smColSpanMap: Record<number, string> = {
  1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4',
  5: 'sm:col-span-5', 6: 'sm:col-span-6', 7: 'sm:col-span-7', 8: 'sm:col-span-8',
  9: 'sm:col-span-9', 10: 'sm:col-span-10', 11: 'sm:col-span-11', 12: 'sm:col-span-12',
}

const mdColSpanMap: Record<number, string> = {
  1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
  5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8',
  9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12',
}

const lgColSpanMap: Record<number, string> = {
  1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4',
  5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8',
  9: 'lg:col-span-9', 10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12',
}

const xlColSpanMap: Record<number, string> = {
  1: 'xl:col-span-1', 2: 'xl:col-span-2', 3: 'xl:col-span-3', 4: 'xl:col-span-4',
  5: 'xl:col-span-5', 6: 'xl:col-span-6', 7: 'xl:col-span-7', 8: 'xl:col-span-8',
  9: 'xl:col-span-9', 10: 'xl:col-span-10', 11: 'xl:col-span-11', 12: 'xl:col-span-12',
}

export const responsiveColSpanMaps: Record<string, Record<number, string>> = {
  '': colSpanMap, sm: smColSpanMap, md: mdColSpanMap, lg: lgColSpanMap, xl: xlColSpanMap,
}

// ── Row-span (Tile height in grid mode) ─────────────────────────────────

const rowSpanMap: Record<number, string> = {
  1: 'row-span-1', 2: 'row-span-2', 3: 'row-span-3',
  4: 'row-span-4', 5: 'row-span-5', 6: 'row-span-6',
}

const smRowSpanMap: Record<number, string> = {
  1: 'sm:row-span-1', 2: 'sm:row-span-2', 3: 'sm:row-span-3',
  4: 'sm:row-span-4', 5: 'sm:row-span-5', 6: 'sm:row-span-6',
}

const mdRowSpanMap: Record<number, string> = {
  1: 'md:row-span-1', 2: 'md:row-span-2', 3: 'md:row-span-3',
  4: 'md:row-span-4', 5: 'md:row-span-5', 6: 'md:row-span-6',
}

const lgRowSpanMap: Record<number, string> = {
  1: 'lg:row-span-1', 2: 'lg:row-span-2', 3: 'lg:row-span-3',
  4: 'lg:row-span-4', 5: 'lg:row-span-5', 6: 'lg:row-span-6',
}

const xlRowSpanMap: Record<number, string> = {
  1: 'xl:row-span-1', 2: 'xl:row-span-2', 3: 'xl:row-span-3',
  4: 'xl:row-span-4', 5: 'xl:row-span-5', 6: 'xl:row-span-6',
}

export const responsiveRowSpanMaps: Record<string, Record<number, string>> = {
  '': rowSpanMap, sm: smRowSpanMap, md: mdRowSpanMap, lg: lgRowSpanMap, xl: xlRowSpanMap,
}

// ── Grid-cols (TileWrapper columns) ─────────────────────────────────────

const gridColsMap: Record<number, string> = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4',
  5: 'grid-cols-5', 6: 'grid-cols-6', 7: 'grid-cols-7', 8: 'grid-cols-8',
  9: 'grid-cols-9', 10: 'grid-cols-10', 11: 'grid-cols-11', 12: 'grid-cols-12',
}

const smGridColsMap: Record<number, string> = {
  1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6', 7: 'sm:grid-cols-7', 8: 'sm:grid-cols-8',
  9: 'sm:grid-cols-9', 10: 'sm:grid-cols-10', 11: 'sm:grid-cols-11', 12: 'sm:grid-cols-12',
}

const mdGridColsMap: Record<number, string> = {
  1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4',
  5: 'md:grid-cols-5', 6: 'md:grid-cols-6', 7: 'md:grid-cols-7', 8: 'md:grid-cols-8',
  9: 'md:grid-cols-9', 10: 'md:grid-cols-10', 11: 'md:grid-cols-11', 12: 'md:grid-cols-12',
}

const lgGridColsMap: Record<number, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7', 8: 'lg:grid-cols-8',
  9: 'lg:grid-cols-9', 10: 'lg:grid-cols-10', 11: 'lg:grid-cols-11', 12: 'lg:grid-cols-12',
}

const xlGridColsMap: Record<number, string> = {
  1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6', 7: 'xl:grid-cols-7', 8: 'xl:grid-cols-8',
  9: 'xl:grid-cols-9', 10: 'xl:grid-cols-10', 11: 'xl:grid-cols-11', 12: 'xl:grid-cols-12',
}

export const responsiveGridColsMaps: Record<string, Record<number, string>> = {
  '': gridColsMap, sm: smGridColsMap, md: mdGridColsMap, lg: lgGridColsMap, xl: xlGridColsMap,
}

// ── Col-start (Tile grid column start) ───────────────────────────────

const colStartMap: Record<number, string> = {
  1: 'col-start-1', 2: 'col-start-2', 3: 'col-start-3', 4: 'col-start-4',
  5: 'col-start-5', 6: 'col-start-6', 7: 'col-start-7', 8: 'col-start-8',
  9: 'col-start-9', 10: 'col-start-10', 11: 'col-start-11', 12: 'col-start-12', 13: 'col-start-13',
}

const smColStartMap: Record<number, string> = {
  1: 'sm:col-start-1', 2: 'sm:col-start-2', 3: 'sm:col-start-3', 4: 'sm:col-start-4',
  5: 'sm:col-start-5', 6: 'sm:col-start-6', 7: 'sm:col-start-7', 8: 'sm:col-start-8',
  9: 'sm:col-start-9', 10: 'sm:col-start-10', 11: 'sm:col-start-11', 12: 'sm:col-start-12', 13: 'sm:col-start-13',
}

const mdColStartMap: Record<number, string> = {
  1: 'md:col-start-1', 2: 'md:col-start-2', 3: 'md:col-start-3', 4: 'md:col-start-4',
  5: 'md:col-start-5', 6: 'md:col-start-6', 7: 'md:col-start-7', 8: 'md:col-start-8',
  9: 'md:col-start-9', 10: 'md:col-start-10', 11: 'md:col-start-11', 12: 'md:col-start-12', 13: 'md:col-start-13',
}

const lgColStartMap: Record<number, string> = {
  1: 'lg:col-start-1', 2: 'lg:col-start-2', 3: 'lg:col-start-3', 4: 'lg:col-start-4',
  5: 'lg:col-start-5', 6: 'lg:col-start-6', 7: 'lg:col-start-7', 8: 'lg:col-start-8',
  9: 'lg:col-start-9', 10: 'lg:col-start-10', 11: 'lg:col-start-11', 12: 'lg:col-start-12', 13: 'lg:col-start-13',
}

const xlColStartMap: Record<number, string> = {
  1: 'xl:col-start-1', 2: 'xl:col-start-2', 3: 'xl:col-start-3', 4: 'xl:col-start-4',
  5: 'xl:col-start-5', 6: 'xl:col-start-6', 7: 'xl:col-start-7', 8: 'xl:col-start-8',
  9: 'xl:col-start-9', 10: 'xl:col-start-10', 11: 'xl:col-start-11', 12: 'xl:col-start-12', 13: 'xl:col-start-13',
}

export const responsiveColStartMaps: Record<string, Record<number, string>> = {
  '': colStartMap, sm: smColStartMap, md: mdColStartMap, lg: lgColStartMap, xl: xlColStartMap,
}

// ── Col-end (Tile grid column end) ───────────────────────────────────

const colEndMap: Record<number, string> = {
  1: 'col-end-1', 2: 'col-end-2', 3: 'col-end-3', 4: 'col-end-4',
  5: 'col-end-5', 6: 'col-end-6', 7: 'col-end-7', 8: 'col-end-8',
  9: 'col-end-9', 10: 'col-end-10', 11: 'col-end-11', 12: 'col-end-12', 13: 'col-end-13',
}

const smColEndMap: Record<number, string> = {
  1: 'sm:col-end-1', 2: 'sm:col-end-2', 3: 'sm:col-end-3', 4: 'sm:col-end-4',
  5: 'sm:col-end-5', 6: 'sm:col-end-6', 7: 'sm:col-end-7', 8: 'sm:col-end-8',
  9: 'sm:col-end-9', 10: 'sm:col-end-10', 11: 'sm:col-end-11', 12: 'sm:col-end-12', 13: 'sm:col-end-13',
}

const mdColEndMap: Record<number, string> = {
  1: 'md:col-end-1', 2: 'md:col-end-2', 3: 'md:col-end-3', 4: 'md:col-end-4',
  5: 'md:col-end-5', 6: 'md:col-end-6', 7: 'md:col-end-7', 8: 'md:col-end-8',
  9: 'md:col-end-9', 10: 'md:col-end-10', 11: 'md:col-end-11', 12: 'md:col-end-12', 13: 'md:col-end-13',
}

const lgColEndMap: Record<number, string> = {
  1: 'lg:col-end-1', 2: 'lg:col-end-2', 3: 'lg:col-end-3', 4: 'lg:col-end-4',
  5: 'lg:col-end-5', 6: 'lg:col-end-6', 7: 'lg:col-end-7', 8: 'lg:col-end-8',
  9: 'lg:col-end-9', 10: 'lg:col-end-10', 11: 'lg:col-end-11', 12: 'lg:col-end-12', 13: 'lg:col-end-13',
}

const xlColEndMap: Record<number, string> = {
  1: 'xl:col-end-1', 2: 'xl:col-end-2', 3: 'xl:col-end-3', 4: 'xl:col-end-4',
  5: 'xl:col-end-5', 6: 'xl:col-end-6', 7: 'xl:col-end-7', 8: 'xl:col-end-8',
  9: 'xl:col-end-9', 10: 'xl:col-end-10', 11: 'xl:col-end-11', 12: 'xl:col-end-12', 13: 'xl:col-end-13',
}

export const responsiveColEndMaps: Record<string, Record<number, string>> = {
  '': colEndMap, sm: smColEndMap, md: mdColEndMap, lg: lgColEndMap, xl: xlColEndMap,
}

// ── Row-start (Tile grid row start) ──────────────────────────────────

const rowStartMap: Record<number, string> = {
  1: 'row-start-1', 2: 'row-start-2', 3: 'row-start-3',
  4: 'row-start-4', 5: 'row-start-5', 6: 'row-start-6', 7: 'row-start-7',
}

const smRowStartMap: Record<number, string> = {
  1: 'sm:row-start-1', 2: 'sm:row-start-2', 3: 'sm:row-start-3',
  4: 'sm:row-start-4', 5: 'sm:row-start-5', 6: 'sm:row-start-6', 7: 'sm:row-start-7',
}

const mdRowStartMap: Record<number, string> = {
  1: 'md:row-start-1', 2: 'md:row-start-2', 3: 'md:row-start-3',
  4: 'md:row-start-4', 5: 'md:row-start-5', 6: 'md:row-start-6', 7: 'md:row-start-7',
}

const lgRowStartMap: Record<number, string> = {
  1: 'lg:row-start-1', 2: 'lg:row-start-2', 3: 'lg:row-start-3',
  4: 'lg:row-start-4', 5: 'lg:row-start-5', 6: 'lg:row-start-6', 7: 'lg:row-start-7',
}

const xlRowStartMap: Record<number, string> = {
  1: 'xl:row-start-1', 2: 'xl:row-start-2', 3: 'xl:row-start-3',
  4: 'xl:row-start-4', 5: 'xl:row-start-5', 6: 'xl:row-start-6', 7: 'xl:row-start-7',
}

export const responsiveRowStartMaps: Record<string, Record<number, string>> = {
  '': rowStartMap, sm: smRowStartMap, md: mdRowStartMap, lg: lgRowStartMap, xl: xlRowStartMap,
}

// ── Row-end (Tile grid row end) ──────────────────────────────────────

const rowEndMap: Record<number, string> = {
  1: 'row-end-1', 2: 'row-end-2', 3: 'row-end-3',
  4: 'row-end-4', 5: 'row-end-5', 6: 'row-end-6', 7: 'row-end-7',
}

const smRowEndMap: Record<number, string> = {
  1: 'sm:row-end-1', 2: 'sm:row-end-2', 3: 'sm:row-end-3',
  4: 'sm:row-end-4', 5: 'sm:row-end-5', 6: 'sm:row-end-6', 7: 'sm:row-end-7',
}

const mdRowEndMap: Record<number, string> = {
  1: 'md:row-end-1', 2: 'md:row-end-2', 3: 'md:row-end-3',
  4: 'md:row-end-4', 5: 'md:row-end-5', 6: 'md:row-end-6', 7: 'md:row-end-7',
}

const lgRowEndMap: Record<number, string> = {
  1: 'lg:row-end-1', 2: 'lg:row-end-2', 3: 'lg:row-end-3',
  4: 'lg:row-end-4', 5: 'lg:row-end-5', 6: 'lg:row-end-6', 7: 'lg:row-end-7',
}

const xlRowEndMap: Record<number, string> = {
  1: 'xl:row-end-1', 2: 'xl:row-end-2', 3: 'xl:row-end-3',
  4: 'xl:row-end-4', 5: 'xl:row-end-5', 6: 'xl:row-end-6', 7: 'xl:row-end-7',
}

export const responsiveRowEndMaps: Record<string, Record<number, string>> = {
  '': rowEndMap, sm: smRowEndMap, md: mdRowEndMap, lg: lgRowEndMap, xl: xlRowEndMap,
}

// ── Resolver ────────────────────────────────────────────────────────────

const BREAKPOINTS: readonly Breakpoint[] = ['sm', 'md', 'lg', 'xl'] as const

/**
 * Converts a ResponsiveValue to a space-separated string of Tailwind classes.
 *   resolveResponsiveClasses(3, responsiveColSpanMaps)
 *     → "col-span-3"
 *   resolveResponsiveClasses({ default: 12, md: 8 }, responsiveColSpanMaps)
 *     → "col-span-12 md:col-span-8"
 */
export function resolveResponsiveClasses(
  value: ResponsiveValue<number> | undefined,
  maps: Record<string, Record<number, string>>,
): string {
  if (value === undefined) return ''

  if (typeof value === 'number') {
    return maps['']?.[value] ?? ''
  }

  const classes: string[] = []

  if (value.default !== undefined) {
    const cls = maps['']?.[value.default]
    if (cls) classes.push(cls)
  }

  for (const bp of BREAKPOINTS) {
    const v = value[bp]
    if (v !== undefined) {
      const cls = maps[bp]?.[v]
      if (cls) classes.push(cls)
    }
  }

  return classes.join(' ')
}
