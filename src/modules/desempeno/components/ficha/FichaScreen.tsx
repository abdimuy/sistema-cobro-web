import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Actividad, Cuenta, FichaUsuario, Jornada } from "../../domain/entities";
import { usePreferencias } from "../../presentation/context/usePreferencias";
import { horaCorta } from "../lib/format";
import { AvisoPantallaAngosta } from "../comunes/Estados";
import type { AbrirVenta } from "../jornada/describirActividades";
import { JornadaTab } from "../jornada/JornadaTab";
import { ActividadTab } from "../actividad/ActividadTab";
import { CuentasTab } from "../cuentas/CuentasTab";
import { FichaEncabezado, type CargaFicha } from "./FichaEncabezado";
import type { PestanaFicha } from "./pestanas";

export type FichaScreenProps = {
  /**
   * Ficha del usuario (contrato v2.2 §8). Con `carga` distinta de "lista" es la
   * última recibida y sólo sostiene el marco (nombre, zona, pestañas): sus
   * cifras no se pintan (D23).
   */
  ficha: FichaUsuario;
  carga: CargaFicha;
  opcionesRegistro: ReadonlyArray<{ valor: string; etiqueta: string }>;
  pestana: PestanaFicha;
  dia: string;
  onCambiarPestana: (p: PestanaFicha) => void;
  onCambiarDia: (dia: string) => void;
  onVolver: () => void;
  onAbrirActividad: (a: Actividad) => void;
  onAbrirCuenta: (c: Cuenta) => void;
  /**
   * Abre el detalle de venta desde el folio de un pago o una visita, con el
   * `docto_pv_id` que manda el API (contrato v2). Opcional: sin él, el folio
   * es texto.
   */
  onAbrirVenta?: AbrirVenta;
  renderFotos?: (a: Actividad) => ReactNode;
  /** `ahora` = `generado_at` de la jornada en el día de hoy; null en días pasados. */
  renderLinea?: (j: Jornada, ahora: string | null) => ReactNode;
  controlesLinea?: ReactNode;
  /** Aviso discreto bajo la navegación (p. ej. "No se pudo actualizar"). */
  aviso?: ReactNode;
};

export function FichaScreen(p: FichaScreenProps) {
  const { periodo: periodoElegido } = usePreferencias();
  const usuario = p.ficha.usuario;
  const hoy = p.ficha.hoy;
  // Las cifras llevan el periodo de SUS datos; el rótulo de una carga, el elegido.
  const periodo = p.carga.tipo === "lista" ? p.ficha.periodo : periodoElegido;
  const pestanas: ReadonlyArray<readonly [PestanaFicha, string, string | null]> = [
    ["jornada", "Jornada", null],
    ["actividad", "Actividad de la zona", null],
    ["cuentas", "Cuentas de la semana", String(usuario.ventasUniverso)],
  ];
  return (
    <section className="flex min-h-full flex-col gap-6 bg-dsm-canvas px-10 pb-24 pt-9">
      <nav className="flex items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={p.onVolver}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="h-3.5 w-3.5" />
          Equipo
        </button>
        <span className="text-muted-foreground/60">/</span>
        <span>{usuario.nombre}</span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {`Datos de las ${horaCorta(p.ficha.generadoAt)}`}
        </span>
      </nav>
      {p.aviso}
      <AvisoPantallaAngosta />
      <FichaEncabezado usuario={usuario} periodo={periodo} hoy={hoy} carga={p.carga} />
      <div
        role="tablist"
        aria-label="Secciones de la ficha"
        className="flex w-max max-w-full gap-1 overflow-x-auto rounded-full bg-dsm-tarjeta p-1 shadow-sm ring-1 ring-border"
      >
        {pestanas.map(([valor, texto, n]) => (
          <button
            key={valor}
            id={`ficha-tab-${valor}`}
            type="button"
            role="tab"
            aria-selected={p.pestana === valor}
            aria-controls={`ficha-panel-${valor}`}
            onClick={() => p.onCambiarPestana(valor)}
            className={cn(
              "inline-flex h-[34px] items-center gap-2 whitespace-nowrap rounded-full px-[18px] text-[13px]",
              p.pestana === valor
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {texto}
            {n && <span className="opacity-60 tabular">{n}</span>}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`ficha-panel-${p.pestana}`}
        aria-labelledby={`ficha-tab-${p.pestana}`}
      >
        {p.pestana === "jornada" && (
          <JornadaTab
            usuario={usuario}
            dia={p.dia}
            hoy={hoy}
            inicioSemanaDia={p.ficha.inicioSemanaDia}
            diasNavegables={p.ficha.diasNavegables}
            onCambiarDia={p.onCambiarDia}
            onAbrirActividad={p.onAbrirActividad}
            onAbrirVenta={p.onAbrirVenta}
            renderFotos={p.renderFotos}
            renderLinea={p.renderLinea}
            controlesLinea={p.controlesLinea}
          />
        )}
        {p.pestana === "actividad" && (
          <ActividadTab
            usuario={usuario}
            opcionesRegistro={p.opcionesRegistro}
            onAbrirActividad={p.onAbrirActividad}
            onAbrirVenta={p.onAbrirVenta}
            renderFotos={p.renderFotos}
          />
        )}
        {p.pestana === "cuentas" && (
          <CuentasTab usuario={usuario} onAbrirCuenta={p.onAbrirCuenta} />
        )}
      </div>
    </section>
  );
}
