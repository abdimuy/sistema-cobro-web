import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Cuenta } from "../../domain/entities";
import { diaDeNegocioDe, dinero2, fechaCorta, horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import { ChipTrato } from "../comunes/ChipTrato";
import { InfoRapida } from "../comunes/InfoRapida";
import { CLASE_TONO_ATRASOS, textoDeAtrasos, tonoDeAtrasos } from "../lib/atrasos";
import { TarjetaCuenta } from "./TarjetaCuenta";
import type { CompromisoDe, CompromisoFila } from "../../presentation/hooks/useAgenda";
import { CLASE_TONO_COMPROMISO, textoDeCompromiso, tonoDeCompromiso } from "../lib/compromiso";

const ENCABEZADOS: ReadonlyArray<readonly [string, boolean]> = [
  ["Estado", false],
  ["Cliente", false],
  ["Venta", false],
  ["Saldo", true],
  ["Semanal", true],
  ["Atrasos", false],
  ["Compromiso", false],
  ["Última actividad", false],
];

const SIN_AGENDA: CompromisoDe = () => ({ estado: "sin_dato" });

// Visitas P2, Tarea 21: el compromiso vigente de la venta tal como lo deriva el
// servidor. Vacío = la agenda llegó y la venta no tiene (o está cerrado sin
// cumplir); "·" = la agenda aún no llega o falló, que no es lo mismo.
function CeldaCompromiso({ fila }: { fila: CompromisoFila }) {
  if (fila.estado !== "listo") {
    return (
      <td
        data-testid="celda-compromiso"
        title={fila.estado === "sin_dato" ? "Sin dato" : undefined}
        className="px-3 py-2.5 text-[12px] text-muted-foreground"
      >
        ·
      </td>
    );
  }
  const c = fila.compromiso;
  const texto = c && textoDeCompromiso(c);
  return (
    <td data-testid="celda-compromiso" className="whitespace-nowrap px-3 py-2.5 text-[12px]">
      {c && texto ? <span className={CLASE_TONO_COMPROMISO[tonoDeCompromiso(c)]}>{texto}</span> : null}
    </td>
  );
}

// D26: no pintar cientos de filas de golpe.
export const FILAS_INICIALES = 60;
export const FILAS_POR_TANDA = 60;

function Atrasos({ n }: { n: number }) {
  return (
    <span className={cn("text-[12px]", CLASE_TONO_ATRASOS[tonoDeAtrasos(n)])}>
      {textoDeAtrasos(n)}
    </span>
  );
}

export function TablaCuentas({
  cuentas,
  onAbrir,
  compromisoDe = SIN_AGENDA,
}: {
  cuentas: readonly Cuenta[];
  onAbrir: (c: Cuenta) => void;
  compromisoDe?: CompromisoDe;
}) {
  const [visibles, setVisibles] = useState(FILAS_INICIALES);
  const centinela = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => setVisibles(FILAS_INICIALES), [cuentas]);

  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo || visibles >= cuentas.length) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisibles((v) => Math.min(v + FILAS_POR_TANDA, cuentas.length));
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [visibles, cuentas.length]);

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
          {cuentas.slice(0, visibles).map((c) => {
            const abrible = c.doctoPvId !== null;
            const compromiso = compromisoDe(c.ventaId);
            const textoCompromiso =
              compromiso.estado === "listo" && compromiso.compromiso
                ? textoDeCompromiso(compromiso.compromiso)
                : null;
            return (
              <tr
                key={c.ventaId}
                data-testid="fila-cuenta"
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
                  <InfoRapida contenido={<TarjetaCuenta cuenta={c} compromiso={textoCompromiso} />}>
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
                <td className="px-3 py-2.5 text-right tabular">{dinero2(c.saldo)}</td>
                <td className="px-3 py-2.5 text-right tabular">{dinero2(c.parcialidad)}</td>
                <td className="px-3 py-2.5">
                  <Atrasos n={c.numAtrasos} />
                </td>
                <CeldaCompromiso fila={compromiso} />
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
          {visibles < cuentas.length && <tr ref={centinela} aria-hidden="true" />}
        </tbody>
      </table>
    </div>
  );
}
