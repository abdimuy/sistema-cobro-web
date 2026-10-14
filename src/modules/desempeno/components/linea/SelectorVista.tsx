import { ChartColumnStacked, ChartGantt, Ellipsis, Layers, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VistaLinea } from "../../presentation/preferencias";
import { usePreferencias } from "../../presentation/context/usePreferencias";
import { InfoRapida, TarjetaNota, TarjetaTitulo } from "../comunes/InfoRapida";

const OPCIONES: ReadonlyArray<{ vista: VistaLinea; icono: LucideIcon; titulo: string; detalle: string }> = [
  { vista: "puntos", icono: Ellipsis, titulo: "Puntos", detalle: "Cada movimiento como un punto" },
  {
    vista: "bloques",
    icono: ChartGantt,
    titulo: "Bloques de trabajo",
    detalle: "Tramos continuos de trabajo y huecos de pausa",
  },
  { vista: "por_hora", icono: ChartColumnStacked, titulo: "Por hora", detalle: "Movimientos por hora, apilados por tipo" },
  {
    vista: "bloques_hora",
    icono: Layers,
    titulo: "Bloques + hora",
    detalle: "Tramos de trabajo con barras por hora encima",
  },
];

// SelectorVista (D16): cómo se ve la línea de actividad. La elección se
// recuerda por computadora (usePreferencias la guarda en localStorage).
export function SelectorVista() {
  const { vista, setVista } = usePreferencias();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Vista</span>
      <div
        role="group"
        aria-label="Línea de actividad"
        className="inline-flex rounded-full bg-dsm-tarjeta p-[3px] shadow-sm ring-1 ring-border"
      >
        {OPCIONES.map((o) => {
          const Icono = o.icono;
          const activa = vista === o.vista;
          return (
            <InfoRapida
              key={o.vista}
              contenido={
                <>
                  <TarjetaTitulo>{o.titulo}</TarjetaTitulo>
                  <TarjetaNota>{o.detalle}</TarjetaNota>
                </>
              }
            >
              <button
                type="button"
                aria-label={o.titulo}
                aria-pressed={activa}
                onClick={() => setVista(o.vista)}
                className={cn(
                  "flex h-8 w-9 items-center justify-center rounded-full transition-colors",
                  activa ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icono aria-hidden className="h-4 w-4" />
              </button>
            </InfoRapida>
          );
        })}
      </div>
    </div>
  );
}
