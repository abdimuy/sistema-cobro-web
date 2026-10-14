import type { VistaLinea } from "../../presentation/preferencias";

// Leyenda de la línea: muestra solo las marcas que usa la vista elegida.
export function Leyenda({ vista }: { vista: VistaLinea }) {
  const conBloques = vista === "bloques" || vista === "bloques_hora";
  const conHoras = vista === "por_hora" || vista === "bloques_hora";
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <i className="h-2 w-2 rounded-full bg-dsm-ok" />
        Pago
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="h-2 w-2 rounded-full bg-dsm-visita" />
        Visita
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="h-2 w-2 rounded-full bg-dsm-violeta" />
        Condonación
      </span>
      {conBloques && (
        <span className="inline-flex items-center gap-1.5" title="Verde con pagos, gris solo visitas, morado solo condonaciones">
          <i className="h-2 w-4 rounded-sm bg-dsm-ok" />
          Trabajando
        </span>
      )}
      {conHoras && (
        <span className="inline-flex items-center gap-1.5">
          <i className="flex h-2.5 items-end gap-px">
            <b className="block h-2.5 w-1 bg-dsm-ok" />
            <b className="block h-1.5 w-1 bg-dsm-visita" />
          </i>
          Por hora
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <i className="dsm-pausa h-2 w-4 rounded-sm" />
        Pausa
      </span>
    </div>
  );
}
