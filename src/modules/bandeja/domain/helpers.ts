// Pure helpers for the bandeja module. No I/O, no framework — safe to unit
// test in isolation and safe to reuse across presentation components (Tasks
// 4-5) without dragging the HTTP layer along.
import type { ConversacionDetalle, ConversacionResumen, UltimaDecision } from "./entities";

// umbralConfianzaBaja mirrors the backend's umbralConfianzaBaja constant
// (internal/reactivacion/app/allowlist.go) — the LLM confidence floor below
// which the copiloto's own triage escalates regardless of señales.
const UMBRAL_CONFIANZA_BAJA = 65;

// confianzaBinaria collapses the 0-100 confianza score into the same
// alta/baja split the backend's policy uses to decide when to escalate.
export function confianzaBinaria(n: number): "alta" | "baja" {
  return n >= UMBRAL_CONFIANZA_BAJA ? "alta" : "baja";
}

// hasBuyDebtOrLowConfidenceSignal looks for a compra/deuda/confianza_baja
// signal in the condensed ultimaDecision row. The queue row does not carry
// the full `senales` list (only the detail view's Decision does) — so this
// reads the free-text `intencion`/`razonEscalamiento` fields the backend
// populates with the same Spanish vocabulary the policy escalates on
// (razonSenalCompra="señal de compra", razonDeuda="deuda"), plus the
// confianza threshold itself.
function hasBuyDebtOrLowConfidenceSignal(d: UltimaDecision): boolean {
  const haystack = `${d.intencion} ${d.razonEscalamiento}`.toLowerCase();
  if (haystack.includes("compra") || haystack.includes("deuda")) return true;
  return confianzaBinaria(d.confianza) === "baja";
}

// colaBucket groups a queue row into the two sections the bandeja screen
// shows: conversations that need a human ("te_necesitan") vs. everything
// else ("al_dia"). The backend already orders the /reactivacion/conversaciones
// response so escalated rows come first — this is purely for rendering
// section headers/dividers client-side.
export function colaBucket(item: ConversacionResumen): "te_necesitan" | "al_dia" {
  if (item.estado === "escalado") return "te_necesitan";

  const d = item.ultimaDecision;
  if (d) {
    if (d.resultado === "escalado" || d.accion === "escalar") return "te_necesitan";
    if (hasBuyDebtOrLowConfidenceSignal(d)) return "te_necesitan";
  }

  return "al_dia";
}

// modoConversacion decides which action panel the ficha shows, based on the
// NEWEST decision (last element of `decisiones` — the audit trail is
// chronological, oldest first, matching the backend's ORDER BY created_at).
export function modoConversacion(
  detalle: ConversacionDetalle,
): "borrador" | "briefing" | "ninguno" {
  const { conversacion, decisiones } = detalle;
  const newest = decisiones.length > 0 ? decisiones[decisiones.length - 1] : null;

  if (conversacion.estado === "escalado") return "briefing";
  if (newest && (newest.accion === "escalar" || newest.resultado === "escalado")) {
    return "briefing";
  }
  if (newest && newest.accion === "responder" && newest.resultado === "propuesto" && newest.borrador) {
    return "borrador";
  }
  return "ninguno";
}

const ESTADO_LABELS: Record<string, string> = {
  contactado: "Contactado",
  respondio: "Respondió",
  conversando: "Conversando",
  escalado: "Escalada",
  interesado: "Interesado",
  enganche: "Enganche",
  descartado: "Descartado",
};

// estadoLabel translates the backend's snake_case estado value into the
// Spanish label the UI shows. Unknown values pass through as-is so a new
// backend estado never renders blank.
export function estadoLabel(estado: string): string {
  return ESTADO_LABELS[estado] ?? estado;
}

const SEGMENTO_LABELS: Record<string, string> = {
  recien_liquidado: "recién liq.",
  por_liquidar_hueco: "por liquidar",
};

// segmentoLabel translates the cohorte segmento value into the short Spanish
// label the UI shows. Unknown values pass through as-is.
export function segmentoLabel(segmento: string): string {
  return SEGMENTO_LABELS[segmento] ?? segmento;
}
