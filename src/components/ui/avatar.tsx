import * as React from 'react'
import { cn } from '@/lib/utils'

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative flex shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  ),
)
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, src, ...props }, ref) => {
    const [error, setError] = React.useState(false)
    const [loaded, setLoaded] = React.useState(false)

    // Reset error state when src changes
    React.useEffect(() => {
      setError(false)
      setLoaded(false)
    }, [src])

    // Don't render if src is empty or invalid
    if (!src || src.trim() === '') {
      return null
    }

    return (
      <img
        ref={ref}
        className={cn('aspect-square h-full w-full', (!loaded || error) && 'hidden', className)}
        src={src}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true)
          setLoaded(false)
        }}
        {...props}
      />
    )
  },
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  ),
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
