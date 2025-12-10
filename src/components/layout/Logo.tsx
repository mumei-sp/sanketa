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
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-pink-200 to-blue-200 shrink-0">
              <span className="text-lg font-bold text-gray-700">S</span>
            </div>
          )}
          <h1 className="font-bold text-lg whitespace-nowrap">Sanketa</h1>
        </Link>
      </Button>
    </div>
  )
}
