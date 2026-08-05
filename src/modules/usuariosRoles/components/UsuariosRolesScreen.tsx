import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsuariosTab } from "./usuarios/UsuariosTab";
import { RolesTab } from "./roles/RolesTab";

// UsuariosRolesScreen hosts the internal Usuarios/Roles tabs for the
// SUPER_ADMIN-only "Usuarios y roles" area of Configuración.
export function UsuariosRolesScreen() {
  return (
    <Tabs defaultValue="usuarios">
      <TabsList>
        <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        <TabsTrigger value="roles">Roles</TabsTrigger>
      </TabsList>
      <TabsContent value="usuarios">
        <UsuariosTab />
      </TabsContent>
      <TabsContent value="roles">
        <RolesTab />
      </TabsContent>
    </Tabs>
  );
}
