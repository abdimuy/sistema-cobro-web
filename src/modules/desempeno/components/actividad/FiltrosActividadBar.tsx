import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { rangoDeDiasDeNegocio } from "@/utils/tiempoDeNegocio";
import {
  REGISTRADO_POR_OFICINA,
  type Catalogos,
  type FiltrosActividad,
  type FormaCobro,
  type TipoActividad,
  type TipoVisitaCatalogo,
} from "../../domain/entities";
import { diaDeNegocioDe, sumarDias } from "../lib/format";

const SELECT =
  "h-9 rounded-full bg-dsm-tarjeta pl-3 pr-7 text-[13px] ring-1 ring-border disabled:opacity-50";
const CAMPO = "flex items-center gap-1.5 text-xs text-muted-foreground";
const ESPERA_BUSQUEDA_MS = 300;

type Props = {
  filtros: FiltrosActividad;
  /** Formas de cobro y tipos de visita del API; null mientras no llegan. */
  catalogos: Catalogos | null;
  opcionesRegistro: ReadonlyArray<{ valor: string; etiqueta: string }>;
  onCambiar: (parcial: Partial<FiltrosActividad>) => void;
  onLimpiar: () => void;
};

function diaDesde(f: FiltrosActividad): string {
  return f.desde ? diaDeNegocioDe(f.desde) : "";
}
// `hasta` es exclusivo (inicio del día siguiente): se muestra el día anterior.
function diaHasta(f: FiltrosActividad): string {
  return f.hasta ? sumarDias(diaDeNegocioDe(f.hasta), -1) : "";
}

function booleanoDe(v: string): boolean | null {
  return v === "con" ? true : v === "sin" ? false : null;
}
function textoDe(v: boolean | null): string {
  return v === true ? "con" : v === false ? "sin" : "";
}

// Junta los literales bajo la etiqueta corta del teléfono (`grupo`), en el
// orden en que los mandó el servidor. Solo acomoda opciones; no decide nada.
function porGrupo(
  tipos: readonly TipoVisitaCatalogo[],
): Array<{ grupo: string; literales: string[] }> {
  const grupos: Array<{ grupo: string; literales: string[] }> = [];
  for (const t of tipos) {
    const g = grupos.find((x) => x.grupo === t.grupo);
    if (g) g.literales.push(t.literal);
    else grupos.push({ grupo: t.grupo, literales: [t.literal] });
  }
  return grupos;
}

function montoDe(texto: string): string | null {
  const t = texto.trim();
  return t === "" ? null : t;
}

export function FiltrosActividadBar({
  filtros,
  catalogos,
  opcionesRegistro,
  onCambiar,
  onLimpiar,
}: Props) {
  const [q, setQ] = useState(filtros.q);
  const [rango, setRango] = useState<{ desde: string; hasta: string } | null>(null);
  const [montoMin, setMontoMin] = useState(filtros.montoMin ?? "");
  const [montoMax, setMontoMax] = useState(filtros.montoMax ?? "");

  // Si los filtros cambian desde fuera (vista, Limpiar), los campos se alinean.
  useEffect(() => {
    setQ(filtros.q);
    setMontoMin(filtros.montoMin ?? "");
    setMontoMax(filtros.montoMax ?? "");
    setRango(null);
  }, [filtros.q, filtros.montoMin, filtros.montoMax, filtros.desde, filtros.hasta]);

  useEffect(() => {
    if (q === filtros.q) return undefined;
    const t = window.setTimeout(() => onCambiar({ q }), ESPERA_BUSQUEDA_MS);
    return () => window.clearTimeout(t);
  }, [q, filtros.q, onCambiar]);

  const desdeVisible = rango?.desde ?? diaDesde(filtros);
  const hastaVisible = rango?.hasta ?? diaHasta(filtros);
  const invertido = desdeVisible !== "" && hastaVisible !== "" && desdeVisible > hastaVisible;

  const cambiarRango = (desde: string, hasta: string) => {
    if (desde !== "" && hasta !== "" && desde > hasta) {
      // rangoDeDiasDeNegocio lanzaría: se avisa y se conserva el filtro anterior.
      setRango({ desde, hasta });
      return;
    }
    setRango(null);
    onCambiar({
      desde: desde ? rangoDeDiasDeNegocio(desde, desde).desde : null,
      hasta: hasta ? rangoDeDiasDeNegocio(hasta, hasta).hasta : null,
    });
  };

  const confirmarMonto = (campo: "montoMin" | "montoMax", texto: string) => {
    const valor = montoDe(texto);
    if (valor !== filtros[campo]) onCambiar({ [campo]: valor });
  };

  const formas = catalogos?.formasCobro ?? [];
  const gruposVisita = porGrupo(catalogos?.tiposVisita ?? []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative">
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cliente o folio"
          className="h-9 w-[220px] rounded-full bg-dsm-tarjeta pl-8 pr-3 text-[13px] outline-none ring-1 ring-border"
        />
      </label>
      <label className={CAMPO}>
        Tipo
        <select
          className={SELECT}
          value={filtros.tipos[0] ?? ""}
          onChange={(e) =>
            onCambiar({ tipos: e.target.value ? [e.target.value as TipoActividad] : [] })
          }
        >
          <option value="">Todos</option>
          <option value="pago">Pagos</option>
          <option value="visita">Visitas</option>
          <option value="condonacion">Condonaciones</option>
        </select>
      </label>
      <label className={CAMPO}>
        Forma
        <select
          className={SELECT}
          disabled={formas.length === 0}
          value={filtros.formasCobro[0] ?? ""}
          onChange={(e) =>
            onCambiar({ formasCobro: e.target.value ? [e.target.value as FormaCobro] : [] })
          }
        >
          <option value="">Todas</option>
          {formas.map((f) => (
            <option key={f.codigo} value={f.codigo}>
              {f.etiqueta}
            </option>
          ))}
        </select>
      </label>
      <label className={CAMPO}>
        Visita
        <select
          className={SELECT}
          disabled={gruposVisita.length === 0}
          value={filtros.tiposVisita[0] ?? ""}
          onChange={(e) => onCambiar({ tiposVisita: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">Todas</option>
          {gruposVisita.map((g) => (
            <optgroup key={g.grupo} label={g.grupo}>
              {g.literales.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className={CAMPO}>
        Registró
        <select
          className={SELECT}
          value={filtros.registradoPor[0] ?? ""}
          onChange={(e) => onCambiar({ registradoPor: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">Todos</option>
          <option value={REGISTRADO_POR_OFICINA}>Oficina</option>
          {opcionesRegistro.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </label>
      <label className={CAMPO}>
        Del
        <input
          type="date"
          className={SELECT}
          value={desdeVisible}
          onChange={(e) => cambiarRango(e.target.value, hastaVisible)}
        />
      </label>
      <label className={CAMPO}>
        al
        <input
          type="date"
          className={SELECT}
          value={hastaVisible}
          onChange={(e) => cambiarRango(desdeVisible, e.target.value)}
        />
      </label>
      {invertido && (
        <span role="alert" className="text-xs text-dsm-rojo">
          El rango está invertido
        </span>
      )}
      <span className={CAMPO}>
        Monto
        <input
          aria-label="Monto mínimo"
          inputMode="decimal"
          placeholder="$ mín"
          className={`${SELECT} w-24`}
          value={montoMin}
          onChange={(e) => setMontoMin(e.target.value)}
          onBlur={() => confirmarMonto("montoMin", montoMin)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        –
        <input
          aria-label="Monto máximo"
          inputMode="decimal"
          placeholder="$ máx"
          className={`${SELECT} w-24`}
          value={montoMax}
          onChange={(e) => setMontoMax(e.target.value)}
          onBlur={() => confirmarMonto("montoMax", montoMax)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </span>
      <label className={CAMPO}>
        Fotos
        <select
          className={SELECT}
          value={textoDe(filtros.conFotos)}
          onChange={(e) => onCambiar({ conFotos: booleanoDe(e.target.value) })}
        >
          <option value="">Todas</option>
          <option value="con">Con fotos</option>
          <option value="sin">Sin fotos</option>
        </select>
      </label>
      <label className={CAMPO}>
        GPS
        <select
          className={SELECT}
          value={textoDe(filtros.conGps)}
          onChange={(e) => onCambiar({ conGps: booleanoDe(e.target.value) })}
        >
          <option value="">Todos</option>
          <option value="con">Con GPS</option>
          <option value="sin">Sin GPS</option>
        </select>
      </label>
      <button
        type="button"
        onClick={onLimpiar}
        className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] hover:bg-muted"
      >
        <X aria-hidden className="h-3.5 w-3.5" />
        Limpiar
      </button>
    </div>
  );
}
