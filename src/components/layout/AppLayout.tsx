import { createContext, useContext, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Logo } from './Logo'
import { useIsDesktop } from '@/hooks/use-mobile'
import { Search, Settings, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { SchoolSettingsPanel } from '@/components/settings/SchoolSettingsPanel'
import { NotificationProvider } from '@/features/notifications/NotificationContext'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getInitials } from '@/utils/format'

interface AppLayoutProps {
  logoPath?: string
}

/* ─── Context for global top-right actions (search, settings, avatar) ─── */
const TopActionsContext = createContext<React.ReactNode>(null)

/** Hook for PageHeader to render the global top-right actions inline */
export function useTopActions() {
  return useContext(TopActionsContext)
}

/**
 * Settings + notifications — the two global controls that must stay reachable
 * at every width. Shared by the desktop TopActions row and the mobile top bar.
 *
 * `pill` is the desktop treatment: raised white circles that read against the
 * aurora canvas. `bar` is the mobile one: flat ghost buttons that sit level
 * with the hamburger beside them, so the three controls read as one set
 * instead of two raised circles and a bare icon.
 */
function GlobalActionButtons({ variant = 'pill' }: { variant?: 'pill' | 'bar' }) {
  const { setSettingsOpen } = useSchoolConfig()
  const shape =
    variant === 'pill'
      ? 'size-10 rounded-full bg-card border border-border shadow-sm'
      : 'size-10 rounded-lg hover:bg-muted'

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={shape}
        onClick={() => setSettingsOpen(true)}
        aria-label="School settings"
      >
        <Settings className="h-[18px] w-[18px] text-foreground" />
      </Button>
      <NotificationBell variant={variant} />
    </>
  )
}

/** Search bar + settings + notifications + avatar — styled to match figma */
function TopActions() {
  const currentUser = useCurrentUser()
  return (
    <div className="hidden md:flex items-center gap-3">
      {/* ── Search bar (desktop) ── */}
      <div className="relative hidden lg:flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search anything"
          className="pl-11 pr-12 h-10 w-[240px] bg-card border border-border rounded-full shadow-sm text-sm placeholder:text-muted-foreground"
        />
        <kbd className="absolute right-3 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      {/* Search icon (tablet only) */}
      <Button variant="ghost" size="icon" className="lg:hidden size-10 rounded-full" aria-label="Search">
        <Search className="h-4 w-4" />
      </Button>

      {/* ── Action icon buttons ── */}
      <GlobalActionButtons />

      {/* ── User avatar with pink ring — profile from the auth session ── */}
      {currentUser && (
        <div className="flex items-center gap-2.5">
          <div
            className="size-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              backgroundColor: 'var(--heading)',
              color: 'var(--card)',
              boxShadow: '0 0 0 2px var(--card), 0 0 0 4px var(--primary)',
            }}
          >
            {getInitials(currentUser.fullName)}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold leading-tight whitespace-nowrap" style={{ color: 'var(--heading)' }}>
              {currentUser.fullName}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">{currentUser.role}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Inner layout — lives inside SidebarProvider so it can read sidebar context.
 * Syncs the sidebar open/closed state with the lg breakpoint:
 *   Desktop (≥ 1024 px) → expanded  |  Tablet (768–1023 px) → icon-only
 * Mobile (< 768 px) is handled automatically by the Sheet-based sidebar.
 */
function LayoutContent({ logoPath }: AppLayoutProps) {
  const isDesktop = useIsDesktop()
  const { setOpen, isMobile, toggleSidebar } = useSidebar()
  const { config } = useSchoolConfig()
  const location = useLocation()

  // Use uploaded school logo if available, otherwise fall back to prop
  const effectiveLogoPath = config.schoolLogo ?? logoPath

  // Sync sidebar state with screen width
  useEffect(() => {
    if (!isMobile) {
      setOpen(isDesktop)
    }
  }, [isDesktop, isMobile, setOpen])

  return (
    <>
      <AppSidebar logoPath={effectiveLogoPath} />
      <SidebarInset className="overflow-hidden">
        {/* ── Mobile top bar (< md) — carries the global actions the desktop
             header hides, so settings and notifications stay reachable.

             Menu on the left, where the drawer it opens slides in from, and
             where every mobile app puts navigation; actions on the right. The
             three controls used to sit together at one end, which read as a
             cluster of equal-weight icons with no hierarchy.

             Frosted rather than flat white so the bar belongs to the aurora
             canvas it floats over instead of capping it with a hard rule.

             Height comes from the 40px controls plus padding rather than a
             `h-*` token — the compact spacing scale makes `h-14` 32px, which
             the buttons then overflowed. ── */}
        <header className="glass-card sticky top-0 z-30 flex md:hidden items-center gap-1 border-b border-border/60 px-2 py-2 pt-[max(env(safe-area-inset-top),0.5rem)]">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-lg hover:bg-muted"
            onClick={() => toggleSidebar()}
          >
            <Menu className="h-[18px] w-[18px]" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Logo logoPath={effectiveLogoPath} className="min-w-0 flex-1 px-1 py-0" />
          <div className="flex shrink-0 items-center gap-0.5">
            <GlobalActionButtons variant="bar" />
          </div>
        </header>

        {/* No separate desktop header — TopActions render inside PageHeader via context */}
        <TopActionsContext.Provider value={<TopActions />}>
          <main
            key={location.pathname}
            className="page-enter scrollbar-thin flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 overflow-y-auto overflow-x-clip min-h-0 min-w-0 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </TopActionsContext.Provider>
      </SidebarInset>

      {/* School settings side panel — opens on gear icon click */}
      <SchoolSettingsPanel />
    </>
  )
}

export function AppLayout({ logoPath }: AppLayoutProps) {
  return (
    // Inside the router (the bell navigates on select) and outside the sidebar
    // so the feed keeps streaming while the mobile drawer is open.
    <NotificationProvider>
      <SidebarProvider>
        <LayoutContent logoPath={logoPath} />
      </SidebarProvider>
    </NotificationProvider>
  )
}
