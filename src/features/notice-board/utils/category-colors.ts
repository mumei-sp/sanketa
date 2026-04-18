/**
 * Brand-coordinated category palette for notice board badges.
 *
 * Every shade derives from `--primary` / `--accent` via `color-mix`, so the
 * whole board recolors when the user switches appearance preset. Badges stay
 * visually distinct per-category (each mix ratio gives a different shade)
 * without clashing with the active theme.
 */

export const NOTICE_CATEGORY_COLORS: Record<string, string> = {
  Academic:     'color-mix(in srgb, var(--primary) 55%, white)',
  Events:       'color-mix(in srgb, var(--accent) 65%, white)',
  Maintenance:  'color-mix(in srgb, var(--accent) 40%, white)',
  Arts:         'color-mix(in srgb, var(--primary) 40%, white)',
  Finance:      'color-mix(in srgb, var(--accent) 80%, var(--heading) 8%)',
  Notice:       'color-mix(in srgb, var(--primary) 80%, var(--heading) 8%)',
  Training:     'color-mix(in srgb, var(--accent) 55%, white)',
  Announcement: 'color-mix(in srgb, var(--primary) 65%, white)',
}

export function getNoticeCategoryColor(category: string | undefined): string {
  return NOTICE_CATEGORY_COLORS[category ?? ''] ?? 'color-mix(in srgb, var(--accent) 40%, white)'
}
