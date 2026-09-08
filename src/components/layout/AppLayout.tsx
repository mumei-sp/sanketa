import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { RouteFallback } from './RouteFallback'
import { Skeleton } from '@/components/ui/skeleton'
import { UserMenu } from './UserMenu'
import { useGlobalSearchShortcut } from '@/features/search/use-search-shortcut'
import { NotificationProvider } from '@/features/notifications/NotificationContext'
import { PermissionProvider, usePermissions } from '@/features/auth/PermissionContext'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'

/**
 * The palette is a chunk of its own — several hundred kilobytes of index and
 * ranking that most sessions never open. The ⌘K listener stays eager; this
 * arrives the first time someone actually reaches for it.
 */
const GlobalSearch = lazy(() =>
  import('@/features/search/GlobalSearch').then(module => ({ default: module.GlobalSearch })),
)

/**
 * The settings panel is the app's largest single component — six sections, a
 * colour picker and a sortable list — mounted on every page and opened on
 * almost none. Same treatment as the palette: it arrives when the gear is.
 */
const SchoolSettingsPanel = lazy(() =>
  import('@/components/settings/SchoolSettingsPanel').then(module => ({
    default: module.SchoolSettingsPanel,
  })),
)

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
  const { canAny } = usePermissions()
  // The panel holds school configuration and the role editor; someone who can
  // do neither has nothing to open.
  const canOpenSettings = canAny(['settings.manage', 'roles.manage'])
  const shape =
    variant === 'pill'
      ? 'size-10 rounded-full bg-card border border-border shadow-sm'
      : 'size-10 rounded-lg hover:bg-muted'

  return (
    <>
      {canOpenSettings && (
        <Button
          variant="ghost"
          size="icon"
          className={shape}
          onClick={() => setSettingsOpen(true)}
          aria-label="School settings"
        >
          <Settings className="h-[18px] w-[18px] text-foreground" />
        </Button>
      )}
      <NotificationBell variant={variant} />
    </>
  )
}

/** Search bar + settings + notifications + avatar — styled to match figma */
function TopActions({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <div className="hidden md:flex items-center gap-3">
      {/* ── Search (desktop) ──
           A button dressed as a field rather than a real input: the search
           itself happens in a dialog, and a text box you can type into that
           then throws the keystrokes away to open something else is a worse
           lie than the placeholder this replaces. */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="relative hidden lg:flex h-10 w-[240px] items-center rounded-full border border-border bg-card pl-11 pr-12 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
        Search anything
        <kbd className="absolute right-3 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      {/* Search icon (tablet only) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden size-10 rounded-full"
        aria-label="Search"
        onClick={onOpenSearch}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* ── Action icon buttons ── */}
      <GlobalActionButtons />

      {/* ── User avatar with pink ring — profile from the auth session ── */}
      <UserMenu />
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
  const { isReady } = usePermissions()
  const isDesktop = useIsDesktop()
  const { setOpen, isMobile, toggleSidebar } = useSidebar()
  const { config, isSettingsOpen } = useSchoolConfig()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchMounted, setSearchMounted] = useState(false)
  // Latches on first open and never resets: unmounting the moment the panel
  // closes would cut its own exit animation short.
  const [settingsMounted, setSettingsMounted] = useState(false)
  const openSearch = useCallback(() => {
    setSearchMounted(true)
    setSearchOpen(true)
  }, [])
  useGlobalSearchShortcut(openSearch)

  // Use uploaded school logo if available, otherwise fall back to prop
  const effectiveLogoPath = config.schoolLogo ?? logoPath

  useEffect(() => {
    if (isSettingsOpen) setSettingsMounted(true)
  }, [isSettingsOpen])

  // Sync sidebar state with screen width
  useEffect(() => {
    if (!isMobile) {
      setOpen(isDesktop)
    }
  }, [isDesktop, isMobile, setOpen])

  // Nothing gated renders until the roles table has landed.
  //
  // `can()` denies while the fetch is in flight, which is the safe answer but
  // the wrong thing to *draw*: every consumer would paint its denied state and
  // then swap — measured as the sidebar going from 1 item to 12 and the
  // settings gear appearing, about 100ms in, on every load. Holding the shell
  // once is cheaper than teaching ten call sites to check `isReady`, and the
  // roles are fetched once per session rather than per navigation.
  if (!isReady) {
    return (
      <SidebarInset className="overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 p-4" aria-busy="true">
          <span className="sr-only">Loading</span>
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </SidebarInset>
    )
  }

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
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-lg hover:bg-muted"
              aria-label="Search"
              onClick={openSearch}
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
            <GlobalActionButtons variant="bar" />
          </div>
        </header>

        {/* No separate desktop header — TopActions render inside PageHeader via context */}
        <TopActionsContext.Provider value={<TopActions onOpenSearch={openSearch} />}>
          <main
            key={location.pathname}
            className="page-enter scrollbar-thin flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 overflow-y-auto overflow-x-clip min-h-0 min-w-0 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
          >
            <ErrorBoundary>
              {/* One boundary for every protected route: each page is its own
                  chunk now, and this covers the moment between the click and
                  that chunk arriving. Inside the ErrorBoundary so a chunk that
                  fails to load surfaces as an error rather than a spinner that
                  never resolves. */}
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </TopActionsContext.Provider>
      </SidebarInset>

      {/* School settings side panel — mounted on first open and kept after, so
          the sheet's own close animation has something to run on. */}
      {settingsMounted && (
        <Suspense fallback={null}>
          <SchoolSettingsPanel />
        </Suspense>
      )}

      {/* Mounted on first open and kept mounted after, so the dialog's own
          close animation has something to run on. */}
      {searchMounted && (
        <Suspense fallback={null}>
          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      )}
    </>
  )
}

export function AppLayout({ logoPath }: AppLayoutProps) {
  return (
    // Permissions outermost: the sidebar, the routes, the search palette and
    // the notification feed all gate on them. Notifications sit inside the
    // router (the bell navigates on select) but outside the sidebar, so the
    // feed keeps streaming while the mobile drawer is open.
    <PermissionProvider>
      <NotificationProvider>
        <SidebarProvider>
          <LayoutContent logoPath={logoPath} />
        </SidebarProvider>
      </NotificationProvider>
    </PermissionProvider>
  )
}
