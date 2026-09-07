import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface LogoProps {
  logoPath?: string
  className?: string
}

/**
 * Brand lockup — the "S" mark plus the wordmark.
 *
 * Rendered as a plain link rather than a `Button variant="link"`: that variant
 * paints `text-primary`, which is the brand pink and left the wordmark washed
 * out against the light app chrome. The wordmark uses `--heading` (brand navy)
 * so it stays legible on the sidebar and the mobile top bar alike.
 */
export function Logo({ logoPath, className }: LogoProps) {
  return (
    <div className={cn('flex min-w-0 items-center justify-start px-2 py-4', className)}>
      <Link
        to="/"
        className="flex min-w-0 items-center gap-2 rounded-md no-underline transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {logoPath ? (
          <img src={logoPath} alt="Sanketa" className="h-8 w-auto shrink-0 object-contain" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[0_6px_16px_-6px_rgb(21_68_110_/_0.35)]">
            <span className="text-lg font-extrabold" style={{ color: 'var(--heading)' }}>
              S
            </span>
          </div>
        )}
        <h1
          className="truncate text-lg font-bold group-data-[collapsible=icon]:hidden"
          style={{ color: 'var(--heading)' }}
        >
          Sanketa
        </h1>
      </Link>
    </div>
  )
}
