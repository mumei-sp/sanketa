import * as React from 'react'
import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { logout } from '@/api/services/auth-service'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getInitials } from '@/utils/format'
import { Logo } from './Logo'
import { navigationItems, visibleNavigationItems, ChevronDownIcon } from '@/config/navigation'
import { usePermissions } from '@/features/auth/PermissionContext'
import { useFamilyScope } from '@/features/family/FamilyScopeContext'
import { cn } from '@/lib/utils'
import { resolveTenantAccess } from '@/mocks/profiles'
import { activeTenant } from '@/mocks/_shared/tenant-context'

interface AppSidebarProps {
  logoPath?: string
}

/**
 * What to call somebody under their name.
 *
 * Their roles at the school in view, because that is what a role is now — and
 * plural, because a person can hold several. Joined rather than reduced to
 * one: "Teacher · Parent" is the true answer for the member of staff whose
 * child attends, and picking one of the two would be a choice nobody asked
 * for.
 */
function useRoleLabel(): string {
  const currentUser = useCurrentUser()
  const { roles } = usePermissions()
  const school = activeTenant()
  const { roleIds } = React.useMemo(
    () => resolveTenantAccess(currentUser?.id),
    // `school` is read inside the resolver, not passed — a real dependency the
    // linter cannot see.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, school],
  )
  const named = roleIds.map(id => roles.find(role => role.id === id)?.name ?? id)
  return named.length > 0 ? named.join(' · ') : 'No role here'
}

export function AppSidebar({ logoPath }: AppSidebarProps) {
  const roleLabel = useRoleLabel()
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()
  const currentUser = useCurrentUser()
  const { can } = usePermissions()

  // What this role can actually open. Everything below iterates this rather
  // than the full config, so a hidden page has no entry to click.
  const { isFamily, isStaff } = useFamilyScope()
  const visibleItems = React.useMemo(
    () => visibleNavigationItems(navigationItems, can, isFamily && !isStaff),
    [can, isFamily, isStaff],
  )
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    // Check for exact match or proper sub-path (followed by /)
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const hasActiveChild = (item: (typeof navigationItems)[0]) => {
    if (!item.children) return false
    return item.children.some(child => {
      if (child.path === '/') {
        return location.pathname === '/'
      }
      return location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
    })
  }

  const handleParentClick = (item: (typeof navigationItems)[0]) => {
    if (!item.children || item.children.length === 0) return

    // In the drawer a parent only opens its sub-items. Jumping straight to the
    // first child navigates, and navigating closes the drawer, so the sub-items
    // flashed past and the rest of them were unreachable.
    if (isMobile) {
      setExpandedItems(prev => {
        const next = new Set(prev)
        if (next.has(item.path)) next.delete(item.path)
        else next.add(item.path)
        return next
      })
      return
    }

    // On desktop the sidebar stays put, so a parent doubles as a shortcut to
    // its first child; the auto-expand effect then reveals its siblings.
    navigate(item.children[0].path)
  }

  // Navigating from the drawer left it open on top of the page it had just
  // loaded — you had to dismiss it by hand to see where you had gone. Closing
  // on the route change covers links, the parent items that jump to their
  // first child, and the browser's own back and forward.
  useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [location.pathname, isMobile, setOpenMobile])

  const isExpanded = (path: string) => expandedItems.has(path)
  // Auto-expand parent items if a child is active, and collapse when no child is active
  useEffect(() => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      visibleItems.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => {
            if (child.path === '/') {
              return location.pathname === '/'
            }
            return (
              location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
            )
          })
          if (hasActiveChild) {
            next.add(item.path)
          } else {
            next.delete(item.path)
          }
        }
      })
      return next
    })
  }, [location.pathname, visibleItems])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center justify-between">
        <Logo logoPath={logoPath} />
        {/* The drawer covers the button that opened it, and the sheet's own
            close is suppressed by the sidebar's `[&>button]:hidden`. */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="tap-target mr-1 size-8 shrink-0 rounded-lg"
            onClick={() => setOpenMobile(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map(item => {
                const hasChildren = item.children && item.children.length > 0
                // For parent items, check if any child is active
                const active = hasChildren ? hasActiveChild(item) : isActive(item.path)

                return (
                  <SidebarMenuItem key={item.path}>
                    {hasChildren ? (
                      <>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.title}
                          size="lg"
                          aria-expanded={isExpanded(item.path)}
                          onClick={() => handleParentClick(item)}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronDownIcon
                            className={cn(
                              'ml-auto transition-transform',
                              isExpanded(item.path) && 'rotate-180',
                            )}
                          />
                        </SidebarMenuButton>
                        {isExpanded(item.path) && (
                          <SidebarMenuSub>
                            {item.children!.map(child => (
                              <SidebarMenuSubItem key={child.path}>
                                <SidebarMenuSubButton asChild isActive={isActive(child.path)}>
                                  <Link to={child.path}>
                                    <child.icon />
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </>
                    ) : (
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title} size="lg">
                        <Link to={item.path}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Who is signed in, then logout — phones only. The PageHeader carries
          the same block top-right from `md` up, so showing it here as well
          would just say it twice; below that it is hidden, and the drawer was
          the one place left to say it. It also fills a footer that was
          otherwise a lone button under a long stretch of empty drawer. */}
      <SidebarFooter>
        {isMobile && currentUser && (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: 'var(--heading)',
                color: 'var(--card)',
                boxShadow: '0 0 0 2px var(--card), 0 0 0 4px var(--primary)',
              }}
            >
              {getInitials(currentUser.fullName)}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold leading-tight"
                style={{ color: 'var(--heading)' }}
              >
                {currentUser.fullName}
              </p>
              <p className="truncate text-xs leading-tight text-muted-foreground">
                {roleLabel}
              </p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              size="lg"
              onClick={() => {
                // See UserMenu: revoke the session, do not merely forget it.
                void logout()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
