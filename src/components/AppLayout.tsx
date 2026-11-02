import { useState } from "react"
import { Outlet } from "react-router-dom"
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
import { UpdaterProvider } from "@/context/UpdaterContext"
import NotificationBell from "./notifications/NotificationBell"
import { ThemeToggle } from "./ThemeToggle"
import { useEtiquetaModuloActual } from "@/hooks/useEtiquetaModuloActual"

// Preferencia local del menú lateral (compacto/expandido) de esta computadora.
const CLAVE_MENU_COMPACTO = "msp.menu_lateral.compacto"

function leerCompacto(): boolean {
  try {
    return localStorage.getItem(CLAVE_MENU_COMPACTO) === "1"
  } catch {
    return false // sin almacenamiento: arranca expandido
  }
}

function guardarCompacto(compacto: boolean) {
  try {
    localStorage.setItem(CLAVE_MENU_COMPACTO, compacto ? "1" : "0")
  } catch {
    /* la preferencia sólo vale para esta sesión */
  }
}

export function AppLayout() {
  const [abierto, setAbierto] = useState(() => !leerCompacto())
  const moduleLabel = useEtiquetaModuloActual()

  return (
    <UpdaterProvider>
      <SidebarProvider
        open={abierto}
        onOpenChange={(v) => {
          setAbierto(v)
          guardarCompacto(!v)
        }}
      >
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden !m-0 !rounded-none !shadow-none">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40">
            <div className="flex items-center gap-2 px-4">
              {/* Escritorio: el botón está al pie del menú; aquí sólo abre el cajón en móvil. */}
              <SidebarTrigger className="-ml-1 md:hidden" />
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
            <div className="ml-auto flex items-center gap-1 pr-4">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <div className="flex-1 overflow-auto min-w-0">
            <Outlet />
          </div>
        </SidebarInset>
        <AppUpdater />
      </SidebarProvider>
    </UpdaterProvider>
  )
}
