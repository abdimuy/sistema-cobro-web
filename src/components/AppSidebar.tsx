import { Link, useLocation } from "react-router-dom"
import { Armchair, ArrowDownCircle, RefreshCw, Loader2 } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { APP_VERSION } from "@/constants/version"
import { useUpdater } from "@/context/UpdaterContext"
import { NavUser } from "./NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function SidebarUpdateBanner() {
  const { state, downloadAndInstall, relaunchApp } = useUpdater()

  if (state.status === "available") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-blue-900/20 dark:to-indigo-950/30">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 size-20 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-2 -ml-2 size-12 rounded-full bg-indigo-400/10 blur-xl" />
        <div className="relative p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-blue-500/15 dark:bg-blue-400/15">
              <ArrowDownCircle className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              v{state.update.version} disponible
            </span>
          </div>
          <button
            onClick={downloadAndInstall}
            className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Actualizar ahora
          </button>
        </div>
      </div>
    )
  }

  if (state.status === "downloading") {
    const percent = state.total ? Math.round((state.progress / state.total) * 100) : 0
    return (
      <div className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-blue-900/20 dark:to-indigo-950/30">
        <div className="relative p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Loader2 className="size-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              Actualizando... {percent}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-blue-200/60 dark:bg-blue-800/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (state.status === "ready") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-teal-50 dark:border-emerald-500/20 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30">
        <div className="absolute top-0 right-0 -mt-3 -mr-3 size-16 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15">
              <RefreshCw className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Listo para reiniciar
            </span>
          </div>
          <button
            onClick={relaunchApp}
            className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            Reiniciar ahora
          </button>
        </div>
      </div>
    )
  }

  return null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { getAvailableModulesWithConfig } = usePermissions()
  const location = useLocation()
  const modules = getAvailableModulesWithConfig()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Armchair className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Muebles San Pablo</span>
                  <span className="truncate text-xs">v{APP_VERSION}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarUpdateBanner />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarMenu>
            {modules.map((module) => {
              const isActive =
                location.pathname === module.path ||
                (module.path !== "/" && location.pathname.startsWith(module.path))
              const Icon = module.icon
              return (
                <SidebarMenuItem key={module.key}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={module.label}>
                    <Link to={module.path}>
                      {Icon && <Icon />}
                      <span>{module.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
