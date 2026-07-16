import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface LogoProps {
  logoPath?: string
  className?: string
}

export function Logo({ logoPath, className }: LogoProps) {
  return (
    <div className={cn('flex items-center justify-start px-2 py-4', className)}>
      <Button variant="link" asChild className="h-auto p-0 hover:no-underline">
        <Link to="/" className="flex items-center gap-2 no-underline">
          {logoPath ? (
            <img
              src={logoPath}
              alt="Sanketa"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shrink-0 shadow-[0_6px_16px_-6px_rgb(21_68_110_/_0.35)]">
              <span className="text-lg font-extrabold text-foreground">S</span>
            </div>
          )}
          <h1 className="font-bold text-lg whitespace-nowrap group-data-[collapsible=icon]:hidden">Sanketa</h1>
        </Link>
      </Button>
    </div>
  )
}
