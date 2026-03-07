/**
 * Root layout: sidebar + main content area. Renders once per app; Outlet shows the current route's page.
 * No feature-specific logic; overflow/min-width here so all pages benefit from non-scrolling shell on mobile.
 */
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

interface AppLayoutProps {
  logoPath?: string
}

export function AppLayout({ logoPath }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar logoPath={logoPath} />
      {/* min-w-0: allows main content to shrink below content size so we don't force horizontal scroll on mobile */}
      <SidebarInset className="overflow-hidden min-w-0">
        {/* min-w-0: same as above for flex child; overflow-x-hidden: prevent page-level horizontal scroll so only inner modules (e.g. wide table) scroll horizontally */}
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto min-h-0 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
