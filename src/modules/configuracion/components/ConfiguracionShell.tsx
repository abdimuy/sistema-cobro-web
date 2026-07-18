import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendedoresScreen } from "./vendedores/VendedoresScreen";
import { ZonasCajasScreen } from "./zonasCajas/ZonasCajasScreen";

// ConfiguracionShell hosts the Configuración area's tabs.
export function ConfiguracionShell() {
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
        </TabsList>
        <TabsContent value="vendedores">
          <VendedoresScreen />
        </TabsContent>
        <TabsContent value="zonas-cajas">
          <ZonasCajasScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
}
