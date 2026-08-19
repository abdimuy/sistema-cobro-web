import dayjs from "dayjs";

import type { VentaLocal } from "@/services/api/getVentasLocales";

/**
 * La fase de una venta: dónde está dentro del carril
 * borrador → revisada → aprobada → aplicada en Microsip, o fuera de él
 * (cancelada / eliminada).
 *
 * Se calcula a partir de TRES dimensiones independientes del dominio —
 * `ESTADO` (active/deleted), `SITUACION` (borrador/revisada/aprobada/cancelada)
 * y `SINCRONIZACION` (pendiente/aplicada). El orden de evaluación importa:
 * una venta puede estar cancelada DESPUÉS de haber llegado a Microsip, y en
 * ese caso manda la cancelación, pero el avance que alcanzó se conserva.
 */

export type FaseKind =
  | "borrador"
  | "revisada"
  | "aprobada"
  | "aplicada"
  | "cancelada"
  | "eliminada";

/** Los cuatro arcos del anillo. El cuarto es el cruce a Microsip. */
export type FaseNumero = 1 | 2 | 3 | 4;

/**
 * Cuánto puede quedarse una venta en cada fase antes de considerarse detenida,
 * en días.
 *
 * DECISIÓN DE NEGOCIO del dueño del producto, no una constante técnica: mover
 * estos números cambia qué ventas se señalan en la tabla. Viven aquí y sólo
 * aquí; nadie más debe escribir "2 días" a mano.
 *
 * La fase 4 (aplicada) no se detiene: ya llegó a Microsip. Las salidas del
 * carril (cancelada / eliminada) tampoco — dejaron de avanzar por decisión, no
 * por olvido.
 */
export const DIAS_PARA_DETENIDA: Record<FaseNumero, number | null> = {
  1: 2, // Borrador
  2: 1, // Revisada
  3: 1, // Aprobada sin aplicar
  4: null, // Aplicada: no aplica
};

const MS_POR_DIA = 86_400_000;

export interface Fase {
  kind: FaseKind;
  /** 1..4 dentro del carril; null para cancelada / eliminada. */
  numero: FaseNumero | null;
  /** Nombre corto para el primer renglón. */
  nombre: string;
  /** Hasta qué arco llegó. Las salidas del carril conservan su avance. */
  arcos: FaseNumero;
  /** false para cancelada / eliminada. */
  enCarril: boolean;
  /** Sólo puede ser true en las fases 1 a 3. */
  detenida: boolean;
  /** Días completos en la fase actual; null si la venta no trae `fase_desde`. */
  diasEnFase: number | null;
  /** Segundo renglón. null = no se muestra (no se inventa una fecha). */
  meta: string | null;
  /** Lo único que sobrevive en densidad compacta. null = nada. */
  metaCompacta: string | null;
}

const NOMBRES: Record<FaseKind, string> = {
  borrador: "Borrador",
  revisada: "Revisada",
  aprobada: "Aprobada",
  aplicada: "Aplicada",
  cancelada: "Cancelada",
  eliminada: "Eliminada",
};

/** Hasta dónde llegó la venta, en palabras, para las salidas del carril. */
const HASTA_DONDE: Record<FaseNumero, string> = {
  1: "llegó a borrador",
  2: "llegó a revisada",
  3: "llegó a aprobada",
  4: "ya estaba en Microsip",
};

/** `FASE_ALCANZADA` sólo sirve si es un entero dentro del carril. */
function faseAlcanzadaValida(valor: number | undefined): FaseNumero | null {
  if (valor === 1 || valor === 2 || valor === 3 || valor === 4) return valor;
  return null;
}

/**
 * Arcos que la venta alcanzó. Dos rutas, a propósito:
 *
 * 1. `FASE_ALCANZADA` — el máximo histórico que el API deriva de la bitácora
 *    real de eventos. Es el dato, no una conjetura, así que manda siempre que
 *    venga: incluso donde la inferencia también acertaría.
 * 2. La heurística — reconstrucción con lo que sobrevive en el DTO (paso por
 *    Microsip, marca de aprobación, situación). Es el respaldo para las ventas
 *    anteriores a la bitácora, que nunca traerán el campo. No se borra.
 *
 * La heurística no puede distinguir una venta cancelada estando en *revisada*
 * de un borrador cancelado — no existe un `revisada_at` en el DTO — y por eso
 * las adivina como 1. Con el campo presente eso deja de pasar.
 *
 * Ojo: esto es el avance MÁXIMO, no la fase actual. Sólo lo consumen las
 * salidas del carril (cancelada / eliminada), que dibujan hasta dónde llegaron;
 * en las fases 1 a 4 los arcos los fija la fase vigente.
 */
export function arcosAlcanzados(venta: VentaLocal): FaseNumero {
  const declarada = faseAlcanzadaValida(venta.FASE_ALCANZADA);
  if (declarada !== null) return declarada;

  if (venta.SINCRONIZACION === "aplicada" || venta.MICROSIP_APLICADA_AT) return 4;

  switch (venta.SITUACION) {
    case "aprobada":
      return 3;
    case "revisada":
      return 2;
    case "cancelada":
      return venta.APROBADO_AT ? 3 : 1;
    case "borrador":
    default:
      return 1;
  }
}

/** "hace 20 min" · "hace 3 h" · "hace 4 d". */
export function textoRelativo(transcurridoMs: number): string {
  const ms = Math.max(0, transcurridoMs);

  const minutos = Math.floor(ms / 60_000);
  if (minutos < 60) return `hace ${Math.max(1, minutos)} min`;

  const horas = Math.floor(ms / 3_600_000);
  if (horas < 24) return `hace ${horas} h`;

  return `hace ${Math.floor(ms / MS_POR_DIA)} d`;
}

/** Fecha corta para la fase 4 y para la línea de tiempo: "18/08 17:03". */
export function fechaCorta(iso: string): string {
  return dayjs(iso).format("DD/MM HH:mm");
}

function fueraDelCarril(kind: FaseKind, arcos: FaseNumero): Fase {
  return {
    kind,
    numero: null,
    nombre: NOMBRES[kind],
    arcos,
    enCarril: false,
    detenida: false,
    diasEnFase: null,
    meta: HASTA_DONDE[arcos],
    metaCompacta: null,
  };
}

/**
 * Deriva la fase de una venta. `ahora` se inyecta para que la prueba mande en
 * el reloj.
 */
export function deriveFase(venta: VentaLocal, ahora: Date = new Date()): Fase {
  const alcanzado = arcosAlcanzados(venta);

  // 1. Eliminada y 2. cancelada ganan a todo lo demás, pero conservan el avance.
  if (venta.ESTADO === "deleted") return fueraDelCarril("eliminada", alcanzado);
  if (venta.SITUACION === "cancelada") return fueraDelCarril("cancelada", alcanzado);

  // 3. Aplicada: al llegar a Microsip el reloj cambia — deja de importar hace
  // cuánto e importa cuándo.
  if (venta.SINCRONIZACION === "aplicada") {
    return {
      kind: "aplicada",
      numero: 4,
      nombre: NOMBRES.aplicada,
      arcos: 4,
      enCarril: true,
      detenida: false,
      diasEnFase: null,
      meta: venta.MICROSIP_APLICADA_AT ? fechaCorta(venta.MICROSIP_APLICADA_AT) : null,
      metaCompacta: null,
    };
  }

  // 4. En carril: la situación manda.
  const kind: FaseKind =
    venta.SITUACION === "aprobada"
      ? "aprobada"
      : venta.SITUACION === "revisada"
        ? "revisada"
        : "borrador";
  const numero: FaseNumero = kind === "aprobada" ? 3 : kind === "revisada" ? 2 : 1;

  const desdeMs = venta.FASE_DESDE ? Date.parse(venta.FASE_DESDE) : NaN;

  // Sin bitácora no hay segundo renglón y no se puede marcar detenida. No se
  // sustituye por `updated_at`: cualquier edición lo mueve y mentiría.
  if (Number.isNaN(desdeMs)) {
    return {
      kind,
      numero,
      nombre: NOMBRES[kind],
      arcos: numero,
      enCarril: true,
      detenida: false,
      diasEnFase: null,
      meta: null,
      metaCompacta: null,
    };
  }

  const transcurridoMs = ahora.getTime() - desdeMs;
  const dias = Math.max(0, Math.floor(transcurridoMs / MS_POR_DIA));
  const umbral = DIAS_PARA_DETENIDA[numero];
  const detenida = umbral !== null && transcurridoMs > umbral * MS_POR_DIA;

  return {
    kind,
    numero,
    nombre: NOMBRES[kind],
    arcos: numero,
    enCarril: true,
    detenida,
    diasEnFase: dias,
    meta: detenida ? `detenida ${dias} d` : textoRelativo(transcurridoMs),
    metaCompacta: detenida ? `${dias} d` : null,
  };
}
