import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendedoresScreen } from "./vendedores/VendedoresScreen";

// ConfiguracionShell hosts the Configuración area's tabs. "Zonas y cajas"
// is a placeholder — task 5 fills it in.
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
          <div className="rounded-lg border border-dashed border-border/60 p-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Próximamente
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
