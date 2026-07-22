import { describe, expect, it } from "vitest";
import { queueItemHint } from "./queueItemHint";
import type { ConversacionResumen, UltimaDecision } from "../../domain/entities";

function buildResumen(overrides: Partial<ConversacionResumen> = {}): ConversacionResumen {
  return {
    clienteId: 1,
    nombre: "MARÍA LÓPEZ",
    segmento: "recien_liquidado",
    estado: "conversando",
    asignadoA: "",
    updatedAt: "2026-07-21T10:00:00Z",
    ultimoMensaje: "",
    ultimaDecision: null,
    ...overrides,
  };
}

function buildUltimaDecision(overrides: Partial<UltimaDecision> = {}): UltimaDecision {
  return {
    intencion: "consulta general",
    confianza: 90,
    accion: "responder",
    resultado: "propuesto",
    razonEscalamiento: "",
    ...overrides,
  };
}

describe("queueItemHint", () => {
  it("estado escalado → tag esc", () => {
    const hint = queueItemHint(buildResumen({ estado: "escalado" }));
    expect(hint.tag).toBe("esc");
    expect(hint.text).toContain("escalada");
  });

  it("señal de compra en intención → tag buy con el mensaje entre comillas", () => {
    const hint = queueItemHint(
      buildResumen({
        ultimoMensaje: "¿qué tienen de comedores?",
        ultimaDecision: buildUltimaDecision({ intencion: "señal de compra" }),
      }),
    );
    expect(hint.tag).toBe("buy");
    expect(hint.text).toContain("señal de compra");
    expect(hint.text).toContain('"¿qué tienen de comedores?"');
  });

  it("razonEscalamiento con deuda → tag esc", () => {
    const hint = queueItemHint(
      buildResumen({
        ultimaDecision: buildUltimaDecision({ razonEscalamiento: "deuda" }),
      }),
    );
    expect(hint.tag).toBe("esc");
    expect(hint.text).toContain("deuda");
  });

  it("confianza baja → tag low + confDot lo", () => {
    const hint = queueItemHint(
      buildResumen({ ultimaDecision: buildUltimaDecision({ confianza: 40 }) }),
    );
    expect(hint.tag).toBe("low");
    expect(hint.confDot).toBe("lo");
    expect(hint.text).toContain("confianza baja");
  });

  it("confianza alta sin señales → confDot hi, sin tag", () => {
    const hint = queueItemHint(
      buildResumen({ ultimaDecision: buildUltimaDecision({ confianza: 95 }) }),
    );
    expect(hint.tag).toBeNull();
    expect(hint.confDot).toBe("hi");
    expect(hint.text).toContain("IA respondió");
  });

  it("sin ultimaDecision y sin ultimoMensaje → texto neutro", () => {
    const hint = queueItemHint(buildResumen());
    expect(hint.tag).toBeNull();
    expect(hint.confDot).toBeNull();
    expect(hint.text).toBe("Sin actividad reciente");
  });
});
