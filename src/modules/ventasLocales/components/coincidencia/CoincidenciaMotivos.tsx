import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { ColumnId } from "../columns";
import {
  coincidenciasOcultas,
  ETIQUETA_MOTIVO,
  motivosDe,
} from "./coincidencias";
import { TextoResaltado } from "./TextoResaltado";

interface Props {
  venta: VentaLocal;
  visibleColumns: ColumnId[];
}

export function CoincidenciaMotivos({ venta, visibleColumns }: Props) {
  const motivos = motivosDe(venta);
  const ocultas = coincidenciasOcultas(venta, visibleColumns);
  const aprox = (venta.COINCIDENCIAS ?? []).some((c) => c.aproximada);
  if (motivos.length === 0 && ocultas.length === 0 && !aprox) return null;
  return (
    <div className="mt-1 flex flex-col gap-1">
      {(motivos.length > 0 || aprox) && (
        <div className="flex flex-wrap items-center gap-1">
          {motivos.map((m) => (
            <span key={m} className="coincide-chip">
              {ETIQUETA_MOTIVO[m]}
            </span>
          ))}
          {aprox && (
            <span
              className="coincide-chip coincide-chip-aprox"
              title={venta.APROXIMADA_DETALLE}
            >
              aprox.
            </span>
          )}
        </div>
      )}
      {ocultas.map((c) => (
        <div key={c.campo} className="text-xs text-muted-foreground">
          Coincide en{" "}
          <b className="font-medium text-foreground">
            {c.campo === "cliente" ? "cliente" : ETIQUETA_MOTIVO[c.campo]}
          </b>
          :{" "}
          <TextoResaltado
            segmentos={c.segmentos}
            aproximada={c.aproximada}
            texto=""
          />
        </div>
      ))}
    </div>
  );
}
