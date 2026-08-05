import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { UsuariosRolesContainer } from "@/modules/usuariosRoles/presentation/composition/UsuariosRolesContainer";
import { UsuariosRolesScreen } from "@/modules/usuariosRoles/components/UsuariosRolesScreen";
import { VendedoresScreen } from "./vendedores/VendedoresScreen";
import { ZonasCajasScreen } from "./zonasCajas/ZonasCajasScreen";

// ConfiguracionShell hosts the Configuración area's tabs. "Usuarios y roles"
// is gated on isSuperAdmin() — role management is stricter than the
// ADMIN-level access the rest of Configuración allows — both the trigger and
// the content are hidden for non-super-admins.
export function ConfiguracionShell() {
  const { isSuperAdmin } = useAuth();
  const mostrarUsuariosRoles = isSuperAdmin();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          Administración del sistema
        </p>
      </div>

      <Tabs defaultValue="vendedores">
        <TabsList>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          <TabsTrigger value="zonas-cajas">Zonas y cajas</TabsTrigger>
          {mostrarUsuariosRoles && <TabsTrigger value="usuarios-roles">Usuarios y roles</TabsTrigger>}
        </TabsList>
        <TabsContent value="vendedores">
          <VendedoresScreen />
        </TabsContent>
        <TabsContent value="zonas-cajas">
          <ZonasCajasScreen />
        </TabsContent>
        {mostrarUsuariosRoles && (
          <TabsContent value="usuarios-roles">
            <UsuariosRolesContainer>
              <UsuariosRolesScreen />
            </UsuariosRolesContainer>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
