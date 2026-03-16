import { Link, useLocation } from "react-router-dom"
import { Armchair } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { APP_VERSION } from "@/constants/version"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { getAvailableModulesWithConfig } = usePermissions()
  const location = useLocation()
  const modules = getAvailableModulesWithConfig()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
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
