import type { ConversacionResumen } from "../../domain/entities";
import { confianzaBinaria } from "../../domain/helpers";

// QueueItemHint is the pre-computed presentation for a queue row's second
// line (mockup `.r2`): which tag (if any) to show, whether to show the
// binary confidence dot, and the text to render.
export type QueueItemHint = {
  tag: "buy" | "esc" | "low" | null;
  confDot: "hi" | "lo" | null;
  text: string;
};

// queueItemHint classifies a queue row using the SAME priority order as
// domain/helpers.ts#colaBucket (escalado > señal de compra > deuda >
// confianza baja > todo bien) so the tag shown on a row always agrees with
// why the row landed in "Te necesitan" vs. "Al día" — it never fabricates a
// status colaBucket didn't already derive from real fields.
export function queueItemHint(item: ConversacionResumen): QueueItemHint {
  const d = item.ultimaDecision;
  const preview = item.ultimoMensaje ? `"${item.ultimoMensaje}"` : "";

  if (item.estado === "escalado" || d?.resultado === "escalado" || d?.accion === "escalar") {
    const motivo = d?.razonEscalamiento || "requiere atención";
    return { tag: "esc", confDot: null, text: `⚑ escalada · ${motivo}` };
  }

  if (d) {
    const haystack = `${d.intencion} ${d.razonEscalamiento}`.toLowerCase();

    if (haystack.includes("compra")) {
      return {
        tag: "buy",
        confDot: null,
        text: preview ? `✦ señal de compra · ${preview}` : "✦ señal de compra",
      };
    }

    if (haystack.includes("deuda")) {
      return { tag: "esc", confDot: null, text: "⚑ escalada · menciona deuda" };
    }

    if (confianzaBinaria(d.confianza) === "baja") {
      return {
        tag: "low",
        confDot: "lo",
        text: preview ? `confianza baja · ${preview}` : "confianza baja",
      };
    }

    return { tag: null, confDot: "hi", text: preview || "IA respondió · esperando respuesta" };
  }

  return { tag: null, confDot: null, text: preview || "Sin actividad reciente" };
}
