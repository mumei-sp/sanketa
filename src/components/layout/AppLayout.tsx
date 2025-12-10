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
      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
