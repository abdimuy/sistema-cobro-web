import { Outlet, useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppUpdater } from "./AppUpdater"
import NotificationBell from "./notifications/NotificationBell"
import { DESKTOP_MODULES } from "@/constants/modules"

function useCurrentModuleLabel() {
  const { pathname } = useLocation()
  const mod = DESKTOP_MODULES.find(
    (m) => pathname === m.path || (m.path !== "/" && pathname.startsWith(m.path))
  )
  return mod?.label ?? "Inicio"
}

export function AppLayout() {
  const moduleLabel = useCurrentModuleLabel()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-medium">
                    {moduleLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 pr-4">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
      <AppUpdater />
    </SidebarProvider>
  )
}
