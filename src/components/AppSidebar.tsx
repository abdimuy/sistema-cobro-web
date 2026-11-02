import { Link, useLocation } from "react-router-dom"
import { Armchair, ArrowDownCircle, RefreshCw, Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { modulosParaMenu } from "@/utils/permissions"
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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

// Atajo según plataforma: ⌘B en Mac, Ctrl+B en el resto (Windows en producción).
function atajoMenu(): string {
  const esMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? "")
  return esMac ? "⌘B" : "Ctrl+B"
}

// Controles de compactar/expandir junto al logo (patrón ChatGPT/Claude).
// Expandido: botón a la derecha del logo. Compacto: al pasar el mouse el logo
// se transforma (crossfade) en el ícono de expandir; fuera de ese hover el logo
// se comporta como siempre. En móvil el menú es un cajón y no se muestran.
function ControlesCompactar() {
  const { state, toggleSidebar, isMobile } = useSidebar()
  if (isMobile) return null
  const compacta = state === "collapsed"
  const atajo = atajoMenu()
  if (!compacta) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Compactar menú"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0 text-sidebar-foreground/70"
          >
            <PanelLeftClose aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{`Compactar menú (${atajo})`}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Expandir menú"
          onClick={toggleSidebar}
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none [&>svg]:size-4"
        >
          <PanelLeftOpen aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{`Expandir menú (${atajo})`}</TooltipContent>
    </Tooltip>
  )
}

// El texto se desvanece al compactar; nowrap evita saltos de línea durante la transición.
const TEXTO_MENU =
  "whitespace-nowrap transition-opacity duration-200 ease-in-out motion-reduce:transition-none group-data-[collapsible=icon]:opacity-0"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { getAvailableModulesWithConfig } = usePermissions()
  const location = useLocation()
  // Con Desempeño de cobradores, Inicio no se repite: las dos son "/" (D9).
  const modules = modulosParaMenu(getAvailableModulesWithConfig())

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="relative flex items-center gap-1">
            <SidebarMenuButton size="lg" asChild className="min-w-0 flex-1">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Armchair className="size-4" />
                </div>
                <div className={`grid flex-1 text-left text-sm leading-tight ${TEXTO_MENU}`}>
                  <span className="truncate font-medium">Muebles San Pablo</span>
                  <span className="truncate text-xs">v{APP_VERSION}</span>
                </div>
              </Link>
            </SidebarMenuButton>
            <ControlesCompactar />
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarUpdateBanner />
        </div>
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
                      <span className={TEXTO_MENU}>{module.label}</span>
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
      {/* Borde clicable: alterna compacto/expandido. */}
      <SidebarRail
        aria-label="Alternar menú lateral"
        title=""
        className="after:transition-colors hover:after:bg-primary/30"
      />
    </Sidebar>
  )
}
