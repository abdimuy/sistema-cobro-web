import { cn } from "@/lib/utils";
import type { Cuenta } from "../../domain/entities";
import { diaDeNegocioDe, dinero, fechaCorta, horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import { ChipTrato } from "../comunes/ChipTrato";
import { InfoRapida } from "../comunes/InfoRapida";
import { TarjetaCuenta } from "./TarjetaCuenta";

// Umbral de color (rotulación), no una regla del negocio.
const ATRASOS_ALTOS = 5;
const ENCABEZADOS: ReadonlyArray<readonly [string, boolean]> = [
  ["Estado", false],
  ["Cliente", false],
  ["Venta", false],
  ["Saldo", true],
  ["Semanal", true],
  ["Atrasos", false],
  ["Última actividad", false],
];

function Atrasos({ n }: { n: number }) {
  if (n === 0) return <span className="text-[12px] text-dsm-ok">Al corriente</span>;
  return (
    <span className={cn("text-[12px]", n >= ATRASOS_ALTOS ? "text-dsm-rojo" : "text-dsm-ambar")}>
      {`${n} ${n === 1 ? "atraso" : "atrasos"}`}
    </span>
  );
}

export function TablaCuentas({
  cuentas,
  onAbrir,
}: {
  cuentas: readonly Cuenta[];
  onAbrir: (c: Cuenta) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {ENCABEZADOS.map(([t, derecha]) => (
              <th
                key={t}
                className={cn(
                  "px-3 py-2 text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.08em] text-muted-foreground",
                  derecha && "text-right",
                )}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cuentas.map((c) => {
            const abrible = c.doctoPvId !== null;
            return (
              <tr
                key={c.ventaId}
                aria-disabled={abrible ? undefined : "true"}
                title={abrible ? undefined : "Sin detalle de venta"}
                tabIndex={abrible ? 0 : undefined}
                onClick={() => {
                  if (abrible) onAbrir(c);
                }}
                onKeyDown={(e) => {
                  if (!abrible || e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onAbrir(c);
                  }
                }}
                className={cn(
                  "border-b border-border last:border-b-0",
                  abrible
                    ? "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    : "opacity-80",
                )}
              >
                <td className="px-3 py-2.5">
                  <InfoRapida contenido={<TarjetaCuenta cuenta={c} />}>
                    <span tabIndex={0} className="inline-block cursor-help">
                      <ChipTrato trato={c.trato} etiqueta={c.etiqueta} />
                    </span>
                  </InfoRapida>
                </td>
                <td className="px-3 py-2.5 text-[13px]">
                  {c.clienteNombre}
                  {c.nueva && (
                    <span className="ml-2 rounded-full bg-dsm-marca-fondo px-1.5 text-[10px] text-dsm-marca">
                      Nueva
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="text-[13px]">{c.producto ?? "—"}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{c.folio ?? "—"}</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular">{dinero(c.saldo)}</td>
                <td className="px-3 py-2.5 text-right tabular">{dinero(c.parcialidad)}</td>
                <td className="px-3 py-2.5">
                  <Atrasos n={c.numAtrasos} />
                </td>
                <td className="px-3 py-2.5 text-[12px]">
                  {c.ultimaActividad ? (
                    <>
                      <span className="font-mono">{`${fechaCorta(diaDeNegocioDe(c.ultimaActividad.hora))} ${horaCorta(c.ultimaActividad.hora)}`}</span>
                      <span className="text-muted-foreground">{` · ${TIPO_ACTIVIDAD_META[c.ultimaActividad.tipo].etiqueta.toLowerCase()}`}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
