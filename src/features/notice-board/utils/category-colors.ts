/**
 * Brand-coordinated category palette for notice board badges.
 *
 * Every shade derives from `--primary` / `--accent` via `color-mix`, so the
 * whole board recolors when the user switches appearance preset. Badges stay
 * visually distinct per-category (each mix ratio gives a different shade)
 * without clashing with the active theme.
 *
 * ── A badge is a sticker, not a surface ───────────────────────────────
 * These stay pale in BOTH themes, on purpose — the design artboards paint the
 * same `#feccfd` chip with the same `#15446e` label in light and in dark, and
 * the attendance day cells are likewise byte-identical across the two. A badge
 * is small enough to read as an object sitting ON the page rather than as part
 * of it, so it keeps its own colour the way a real sticker would.
 *
 * That only works if the LABEL is fixed too. Pair these with
 * `--heading-accent`, which `applyAppearance` holds at the school's brand
 * colour in both themes — never with `--heading`, which follows the theme to
 * near-white and then measures 1.01:1 against its own chip. That mismatch, not
 * these values, was the dark-mode bug: `NoticeBoard` and `NoticePreviewCard`
 * read `--heading` while `NoticeCard` read `--heading-accent`.
 *
 * A large tinted SURFACE is the opposite case and takes the opposite rule —
 * see the timetable slots, which composite over `--card` so they darken with
 * the page.
 */

export const NOTICE_CATEGORY_COLORS: Record<string, string> = {
  Academic:     'color-mix(in srgb, var(--primary) 55%, white)',
  Events:       'color-mix(in srgb, var(--accent) 65%, white)',
  Maintenance:  'color-mix(in srgb, var(--accent) 40%, white)',
  Arts:         'color-mix(in srgb, var(--primary) 40%, white)',
  // These two used to add `var(--heading) 8%` as a darkener, which in dark mode
  // is a *lightener* — the same chip drifting between themes for no reason a
  // reader could see. Plain `white` keeps them fixed like their siblings; the
  // 80% ratio is what tells them apart from Announcement and Events.
  Finance:      'color-mix(in srgb, var(--accent) 80%, white)',
  Notice:       'color-mix(in srgb, var(--primary) 80%, white)',
  Training:     'color-mix(in srgb, var(--accent) 55%, white)',
  Announcement: 'color-mix(in srgb, var(--primary) 65%, white)',
}

export function getNoticeCategoryColor(category: string | undefined): string {
  return NOTICE_CATEGORY_COLORS[category ?? ''] ?? 'color-mix(in srgb, var(--accent) 40%, white)'
}
