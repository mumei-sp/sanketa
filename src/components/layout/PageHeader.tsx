import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Tile } from '@/components/tile'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { navigationItems } from '@/config/navigation'
import { cn } from '@/lib/utils'

/**
 * Breadcrumb item structure for PageHeader
 */
export interface PageHeaderBreadcrumbItem {
  /** Label text for the breadcrumb */
  label: string
  /** Optional href/link for the breadcrumb (if not provided, it's the current page) */
  href?: string
}

/**
 * Props for the PageHeader component.
 */
export interface PageHeaderProps {
  /** The main page title (required) */
  title: string
  /** Array of breadcrumb items to display above the title */
  breadcrumbs?: PageHeaderBreadcrumbItem[]
  /** Whether to show the back button */
  showBackButton?: boolean
  /** Callback function when back button is clicked (defaults to navigate(-1) if not provided) */
  onBack?: () => void
  /** ReactNode slot for actions (search, filters, profile menu, etc.) */
  actions?: React.ReactNode
  /** Additional CSS classes for the outer container */
  className?: string
}

/**
 * PageHeader - A reusable header component for admin dashboard pages.
 *
 * Provides a consistent header structure with optional back button, title, breadcrumbs,
 * and actions slot. Wrapped in a Tile component for consistent card styling.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Add New Student"
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/' },
 *     { label: 'Students', href: '/students' },
 *     { label: 'Add New Student' }
 *   ]}
 *   showBackButton
 *   onBack={() => navigate(-1)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Attendance"
 *   actions={
 *     <div className="flex items-center gap-2">
 *       <Button variant="ghost" size="icon">
 *         <Search className="size-4" />
 *       </Button>
 *       <Button variant="ghost" size="icon">
 *         <Filter className="size-4" />
 *       </Button>
 *     </div>
 *   }
 * />
 * ```
 */
export default function PageHeader({
  title,
  breadcrumbs,
  showBackButton = false,
  onBack,
  actions,
  className,
}: PageHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // Get all main route paths (top-level routes without children, or routes that are direct children)
  // Memoized with navigationItems as dependency since it's imported from config
  const mainRoutePaths = React.useMemo(() => {
    const paths = new Set<string>()
    navigationItems.forEach(item => {
      // Add main routes (routes without children)
      if (!item.children) {
        paths.add(item.path)
      } else {
        // For routes with children, add the parent path and all child paths
        paths.add(item.path)
        item.children.forEach(child => {
          paths.add(child.path)
        })
      }
    })
    return paths
  }, [navigationItems])

  // Check if current route is a main route
  const isMainRoute = mainRoutePaths.has(location.pathname)

  // Show back button only if:
  // 1. Explicitly requested via showBackButton prop, OR
  // 2. Not on a main route AND breadcrumbs exist with more than 1 item
  const shouldShowBackButton =
    showBackButton || (!isMainRoute && breadcrumbs && breadcrumbs.length > 1)

  // Default back handler: navigate back if onBack is not provided
  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }, [onBack, navigate])

  return (
    <Tile
      id="page-header"
      layoutMode="block"
      background="default"
      borderRadius="lg"
      shadowed={false}
      className={cn(className)}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {shouldShowBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0 h-9 w-9 bg-card hover:bg-muted"
              aria-label="Go back"
            >
              <ArrowLeft className="size-5" />
            </Button>
          )}

          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-2xl font-semibold text-foreground truncate">{title}</h1>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1
                    return (
                      <React.Fragment key={index}>
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : crumb.href ? (
                            <BreadcrumbLink asChild>
                              <Link to={crumb.href}>{crumb.label}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <span className="text-muted-foreground">{crumb.label}</span>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                      </React.Fragment>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </Tile>
  )
}
