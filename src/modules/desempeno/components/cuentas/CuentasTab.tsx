import { useEffect, useMemo, useState } from "react";
import { CircleOff, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ConteosCuentas,
  Cuenta,
  Direccion,
  OrdenCuentas,
  SegmentoFiltro,
  UsuarioTablero,
} from "../../domain/entities";
import type { ConsultaCuentas } from "../../application/ports/DesempenoPort";
import { useCuentas } from "../../presentation/hooks/useCuentas";
import { ErrorConReintento, EstadoVacio } from "../comunes/Estados";
import { InfoRapida, TarjetaNota, TarjetaTitulo } from "../comunes/InfoRapida";
import { TablaCuentas } from "./TablaCuentas";

const PILDORAS: ReadonlyArray<readonly [SegmentoFiltro, string, keyof ConteosCuentas]> = [
  ["sin_visitar", "Sin visitar", "sinVisitar"],
  ["volver", "Volver", "volver"],
  ["despues", "Después", "despues"],
  ["pagados", "Pagados", "pagados"],
];

const ORDENES: Record<string, { texto: string; orden: OrdenCuentas; dir: Direccion }> = {
  atrasos: { texto: "Más atrasos", orden: "atrasos", dir: "desc" },
  saldo: { texto: "Mayor saldo", orden: "saldo", dir: "desc" },
  ultima_actividad: { texto: "Actividad reciente", orden: "ultima_actividad", dir: "desc" },
  cliente: { texto: "Cliente A–Z", orden: "cliente", dir: "asc" },
};
const ESPERA_BUSQUEDA_MS = 300;
const PILDORA =
  "inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-[12.5px] ring-1 ring-border";

// Cuentas de la semana del usuario (contrato §5). Segmentos y estados los
// calcula el servidor igual que el teléfono (D5, D6); los conteos de las
// pastillas son los del API.
export function CuentasTab({
  usuario,
  onAbrirCuenta,
}: {
  usuario: UsuarioTablero;
  onAbrirCuenta: (c: Cuenta) => void;
}) {
  const [segmento, setSegmento] = useState<SegmentoFiltro>("sin_visitar");
  const [clave, setClave] = useState("atrasos");
  const [escrito, setEscrito] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setQ(escrito.trim()), ESPERA_BUSQUEDA_MS);
    return () => window.clearTimeout(t);
  }, [escrito]);

  const consulta = useMemo<ConsultaCuentas>(
    () => ({ segmento, q, orden: ORDENES[clave].orden, dir: ORDENES[clave].dir }),
    [segmento, q, clave],
  );
  const { cuentas, isLoading, error, refresh } = useCuentas(usuario.uid, consulta);
  const conteos = cuentas?.conteos;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {PILDORAS.map(([valor, texto, campo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={segmento === valor}
              onClick={() => setSegmento(valor)}
              className={cn(
                PILDORA,
                segmento === valor ? "bg-foreground text-background" : "bg-dsm-tarjeta hover:bg-muted",
              )}
            >
              {texto}
              <b className="font-medium tabular">{conteos ? conteos[campo] : "·"}</b>
            </button>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <InfoRapida
            contenido={
              <>
                <TarjetaTitulo>Sin nada</TarjetaTitulo>
                <TarjetaNota>Ventas del universo sin pago ni visita esta semana.</TarjetaNota>
              </>
            }
          >
            <button
              type="button"
              aria-pressed={segmento === "sin_nada"}
              onClick={() => setSegmento("sin_nada")}
              className={cn(
                PILDORA,
                segmento === "sin_nada"
                  ? "bg-foreground text-background"
                  : "bg-dsm-tarjeta hover:bg-muted",
              )}
            >
              <CircleOff aria-hidden className="h-3.5 w-3.5" />
              Sin nada
              <b className="font-medium tabular">{conteos ? conteos.sinNada : "·"}</b>
            </button>
          </InfoRapida>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              placeholder="Cliente o folio"
              className="h-9 w-[200px] rounded-full bg-dsm-tarjeta pl-8 pr-3 text-[13px] outline-none ring-1 ring-border"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Ordenar
            <select
              className="h-9 rounded-full bg-dsm-tarjeta pl-3 pr-7 text-[13px] ring-1 ring-border"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            >
              {Object.entries(ORDENES).map(([k, o]) => (
                <option key={k} value={k}>
                  {o.texto}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && !cuentas ? (
        <ErrorConReintento
          titulo="No se pudieron cargar las cuentas"
          mensaje={error.message}
          onReintentar={refresh}
        />
      ) : isLoading && !cuentas ? (
        <div className="h-48 animate-pulse rounded-[14px] bg-dsm-tarjeta" />
      ) : cuentas && cuentas.cuentas.length === 0 ? (
        <div className="rounded-[14px] bg-dsm-tarjeta ring-1 ring-border">
          <EstadoVacio titulo="No hay cuentas en este grupo" />
        </div>
      ) : cuentas ? (
        <TablaCuentas cuentas={cuentas.cuentas} onAbrir={onAbrirCuenta} />
      ) : null}
    </div>
  );
}
