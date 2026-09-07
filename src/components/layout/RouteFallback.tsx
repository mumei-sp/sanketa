/**
 * What fills the page area while a route's chunk downloads.
 *
 * Routes are code-split, so the first visit to any screen has to fetch its
 * JavaScript. That gap is usually a few hundred milliseconds on a phone, and
 * an empty frame for that long reads as a broken navigation.
 *
 * Deliberately generic — a header bar and a few blocks. Every page already
 * ships its own data-loading skeleton, and this one only covers the moment
 * before that page's code exists to render it. Trying to guess each page's
 * shape here would mean maintaining a second copy of every layout.
 */

import { Skeleton } from '@/components/ui/skeleton'

export function RouteFallback() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

/**
 * The same idea for the signed-out screens, which render on a full-bleed
 * gradient rather than inside the app shell.
 */
export function AuthRouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6" aria-busy="true">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-[420px] w-full max-w-sm rounded-2xl" />
    </div>
  )
}
