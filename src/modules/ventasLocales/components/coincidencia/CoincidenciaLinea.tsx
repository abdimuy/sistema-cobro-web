import { Hash, MapPin, Package, Phone, User, type LucideIcon } from "lucide-react";
import type { VentaLocal } from "@/services/api/getVentasLocales";
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { CampoCoincidencia } from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";
import { coincidenciasOcultas, ventanaAlrededor } from "./coincidencias";
import { TextoResaltado } from "./TextoResaltado";

const ICONO: Record<CampoCoincidencia, LucideIcon> = {
  cliente: User,
  telefono: Phone,
  folio: Hash,
  direccion: MapPin,
  articulos: Package,
};

const ETIQUETA_CAMPO: Record<CampoCoincidencia, string> = {
  cliente: "Cliente",
  telefono: "Teléfono",
  folio: "Folio",
  direccion: "Dirección",
  articulos: "Artículos",
};

interface Props {
  venta: VentaLocal;
  visibleColumns: ColumnId[];
}

/**
 * Con búsqueda, TODAS las filas llevan esta segunda línea de un renglón (misma
 * altura, decisión del dueño 2026-11-20): la primera coincidencia que no se ve
 * en una columna, con su ícono y "+N" si hay más; al pasar el ratón, todas
 * completas. Si sólo coincidió en columnas visibles, la dirección en gris.
 */
export function CoincidenciaLinea({ venta, visibleColumns }: Props) {
  const coincidencias = venta.COINCIDENCIAS ?? [];
  if (coincidencias.length === 0) return null;
  const ocultas = coincidenciasOcultas(venta, visibleColumns);
  const aprox = coincidencias.find((c) => c.aproximada);
  const chipAprox = aprox && (
    <span
      className="coincide-chip coincide-chip-aprox flex-none"
      title={venta.APROXIMADA_DETALLE}
    >
      aprox.
    </span>
  );
  const linea = "mt-[3px] flex h-[18px] min-w-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground";

  const primera = ocultas[0];
  if (!primera) {
    return (
      <div data-testid="coincidencia-linea" className={linea}>
        {chipAprox}
        {venta.DIRECCION && (
          <>
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 flex-none opacity-70" />
            <span className="truncate opacity-80">{venta.DIRECCION}</span>
          </>
        )}
      </div>
    );
  }

  const Icono = ICONO[primera.campo];
  const mas = ocultas.length - 1;
  const aria = ocultas
    .map((c) => `Coincide en ${ETIQUETA_CAMPO[c.campo].toLowerCase()}: ${c.segmentos.map((s) => s.texto).join("")}`)
    .join(". ");

  return (
    <div data-testid="coincidencia-linea" className={linea}>
      {chipAprox}
      <HoverCard openDelay={250} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label={aria}
            className="flex min-w-0 items-center gap-1.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icono aria-hidden="true" className="h-3.5 w-3.5 flex-none opacity-70" />
            <span className="truncate">
              <TextoResaltado
                segmentos={ventanaAlrededor(primera.segmentos)}
                aproximada={primera.aproximada}
                texto=""
              />
            </span>
            {mas > 0 && (
              <span className="coincide-mas flex-none">{`+${mas}`}</span>
            )}
          </button>
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent
            side="bottom"
            align="start"
            collisionPadding={8}
            onClick={(e) => e.stopPropagation()}
            className="w-[340px] p-3 text-xs motion-reduce:animate-none"
          >
            <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              {ocultas.length === 1 ? "Coincide en 1 campo" : `Coincide en ${ocultas.length} campos`}
            </div>
            <ul className="flex flex-col">
              {ocultas.map((c) => {
                const I = ICONO[c.campo];
                return (
                  <li key={c.campo} className="flex items-start gap-2 border-t border-border/60 py-1.5">
                    <I aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 flex-none text-muted-foreground" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-foreground/80">{ETIQUETA_CAMPO[c.campo]}</span>
                      <span className="leading-snug text-foreground">
                        <TextoResaltado segmentos={c.segmentos} aproximada={c.aproximada} texto="" />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCard>
    </div>
  );
}
