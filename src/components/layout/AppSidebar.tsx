import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { Logo } from './Logo'
import { navigationItems, ChevronDownIcon } from '@/config/navigation'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  logoPath?: string
}

export function AppSidebar({ logoPath }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
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
    // If clicking on a parent with children, navigate to first child
    // The auto-expand useEffect will handle expanding the menu
    if (item.children && item.children.length > 0) {
      const firstChild = item.children[0]
      navigate(firstChild.path)
    }
  }

  const isExpanded = (path: string) => expandedItems.has(path)
  // Auto-expand parent items if a child is active, and collapse when no child is active
  useEffect(() => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      navigationItems.forEach(item => {
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
  }, [location.pathname])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo logoPath={logoPath} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => {
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

      {/* Logout footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              size="lg"
              onClick={e => e.preventDefault()}
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
