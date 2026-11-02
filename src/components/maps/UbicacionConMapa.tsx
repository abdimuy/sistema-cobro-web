import { lazy, Suspense, useState } from "react";
import { Maximize2 } from "lucide-react";
import { coordenadasValidas } from "./coordenadas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// Lazy: no se carga el bundle de mapas si el modal no tiene ubicación.
const FichaMapEmbed = lazy(() =>
  import("@/modules/clientes/components/ficha/FichaMapEmbed").then((m) => ({
    default: m.FichaMapEmbed,
  })),
);

/**
 * Mapa de la ubicación de un pago o una visita, con botón para verlo en
 * grande. Si la coordenada no es válida no pinta nada (el llamador muestra su
 * texto de "sin ubicación").
 */
export function UbicacionConMapa({
  lat,
  lng,
  alto = "320px",
  titulo = "Ubicación",
}: {
  lat: number | null | undefined;
  lng: number | null | undefined;
  alto?: string;
  titulo?: string;
}) {
  const [grande, setGrande] = useState(false);
  if (!coordenadasValidas(lat, lng) || lng == null) return null;
  return (
    <>
      <div className="relative overflow-hidden rounded-md border border-border/40" style={{ height: alto }}>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center bg-muted/30">
              <span className="font-mono text-[11px] text-muted-foreground/60">Cargando mapa…</span>
            </div>
          }
        >
          <FichaMapEmbed lat={lat} lng={lng} alto={alto} />
        </Suspense>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Ver mapa en grande"
          onClick={() => setGrande(true)}
          className="absolute right-2 top-2 h-7 gap-1.5 px-2 text-[11px] shadow"
        >
          <Maximize2 aria-hidden />
          Ampliar
        </Button>
      </div>
      <Dialog open={grande} onOpenChange={setGrande}>
        <DialogContent className="block max-w-[1100px] w-[96vw] gap-0 p-4">
          <DialogTitle className="mb-3 text-sm font-medium">{titulo}</DialogTitle>
          <DialogDescription className="sr-only">Mapa ampliado del lugar donde se registró</DialogDescription>
          <Suspense fallback={<span className="font-mono text-[11px]">Cargando mapa…</span>}>
            <FichaMapEmbed lat={lat} lng={lng} alto="75vh" />
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
}
