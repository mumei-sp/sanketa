import { createContext, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Logo } from './Logo'
import { useIsDesktop } from '@/hooks/use-mobile'
import { Search, Settings, Bell, Menu, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { baseColors } from '@/theme/colors'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { SchoolSettingsPanel } from '@/components/settings/SchoolSettingsPanel'

interface AppLayoutProps {
  logoPath?: string
}

/* ─── Context for global top-right actions (search, settings, avatar) ─── */
const TopActionsContext = createContext<React.ReactNode>(null)

/** Hook for PageHeader to render the global top-right actions inline */
export function useTopActions() {
  return useContext(TopActionsContext)
}

/** Search bar + settings + notifications + avatar — styled to match figma */
function TopActions() {
  const { setSettingsOpen } = useSchoolConfig()
  return (
    <div className="hidden md:flex items-center gap-3">
      {/* ── Search bar (desktop) ── */}
      <div className="relative hidden lg:flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search anything"
          className="pl-11 pr-10 h-10 w-[240px] bg-card border border-border rounded-full shadow-sm text-sm placeholder:text-muted-foreground"
        />
        <SlidersHorizontal className="absolute right-3.5 h-4 w-4 text-muted-foreground" />
      </div>
      {/* Search icon (tablet only) */}
      <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-full">
        <Search className="h-4 w-4" />
      </Button>

      {/* ── Action icon buttons ── */}
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full bg-card border border-border shadow-sm"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="h-4 w-4 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full bg-card border border-border shadow-sm"
      >
        <Bell className="h-4 w-4 text-foreground" />
      </Button>

      {/* ── User avatar with pink ring ── */}
      <div className="flex items-center gap-2.5">
        <div
          className="size-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{
            backgroundColor: baseColors.heading,
            boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${baseColors.pink}`,
          }}
        >
          SA
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold leading-tight whitespace-nowrap" style={{ color: baseColors.heading }}>
            Surya Admin
          </p>
          <p className="text-xs text-muted-foreground leading-tight">Admin</p>
        </div>
      </div>
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
        {/* ── Mobile top bar (< md) ── */}
        <header className="flex md:hidden items-center justify-between px-4 h-12 border-b bg-background">
          <Logo logoPath={effectiveLogoPath} className="px-0 py-0" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toggleSidebar()}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </header>

        {/* No separate desktop header — TopActions render inside PageHeader via context */}
        <TopActionsContext.Provider value={<TopActions />}>
          <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto min-h-0">
            <Outlet />
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
    <SidebarProvider>
      <LayoutContent logoPath={logoPath} />
    </SidebarProvider>
  )
}
