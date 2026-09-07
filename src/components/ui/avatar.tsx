import * as React from 'react'
import { cn } from '@/lib/utils'

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        className,
      )}
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
        // Sits above the fallback (which is absolutely positioned) so a loaded
        // photo covers the initials rather than sitting beside them.
        className={cn(
          'relative z-10 aspect-square h-full w-full',
          (!loaded || error) && 'hidden',
          className,
        )}
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
      // Absolute so it never takes flow space next to the image: as a flex
      // sibling it pushed the initials out past the avatar's clipped bounds.
      className={cn(
        'absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  ),
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
