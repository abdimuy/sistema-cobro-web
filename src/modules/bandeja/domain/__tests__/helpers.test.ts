import { describe, it, expect } from "vitest";
import {
  colaBucket,
  confianzaBinaria,
  modoConversacion,
  estadoLabel,
  segmentoLabel,
} from "../helpers";
import type {
  ConversacionDetalle,
  ConversacionResumen,
  Decision,
  UltimaDecision,
} from "../entities";

function buildResumen(overrides: Partial<ConversacionResumen> = {}): ConversacionResumen {
  return {
    clienteId: 24037,
    nombre: "MINERVA LOPEZ",
    segmento: "recien_liquidado",
    estado: "contactado",
    asignadoA: "",
    updatedAt: "2026-07-21T10:00:00Z",
    ultimoMensaje: "hola",
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

function buildDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    intencion: "consulta general",
    confianza: 90,
    senales: [],
    accion: "responder",
    borrador: "hola, con gusto te apoyo",
    evidencia: [],
    razonEscalamiento: "",
    resultado: "propuesto",
    createdAt: "2026-07-21T10:00:00Z",
    ...overrides,
  };
}

function buildDetalle(overrides: {
  estado?: string;
  decisiones?: Decision[];
} = {}): ConversacionDetalle {
  return {
    conversacion: {
      clienteId: 24037,
      nombre: "MINERVA LOPEZ",
      segmento: "recien_liquidado",
      telefono: "2381234567",
      estado: overrides.estado ?? "contactado",
      asignadoA: "",
      contextoNota: "",
      banderas: [],
      resumenMemoria: "",
      createdAt: "2026-07-21T10:00:00Z",
      updatedAt: "2026-07-21T10:00:00Z",
    },
    turnos: [],
    decisiones: overrides.decisiones ?? [],
  };
}

describe("colaBucket", () => {
  it("estado escalado → te_necesitan", () => {
    const item = buildResumen({ estado: "escalado" });
    expect(colaBucket(item)).toBe("te_necesitan");
  });

  it("ultimaDecision.resultado escalado → te_necesitan", () => {
    const item = buildResumen({
      ultimaDecision: buildUltimaDecision({ resultado: "escalado" }),
    });
    expect(colaBucket(item)).toBe("te_necesitan");
  });

  it("ultimaDecision.accion escalar → te_necesitan", () => {
    const item = buildResumen({
      ultimaDecision: buildUltimaDecision({ accion: "escalar" }),
    });
    expect(colaBucket(item)).toBe("te_necesitan");
  });

  it("razonEscalamiento con señal de compra → te_necesitan", () => {
    const item = buildResumen({
      ultimaDecision: buildUltimaDecision({ razonEscalamiento: "señal de compra" }),
    });
    expect(colaBucket(item)).toBe("te_necesitan");
  });

  it("razonEscalamiento con deuda → te_necesitan", () => {
    const item = buildResumen({
      ultimaDecision: buildUltimaDecision({ razonEscalamiento: "deuda" }),
    });
    expect(colaBucket(item)).toBe("te_necesitan");
  });

  it("confianza baja (<65) en ultimaDecision → te_necesitan", () => {
    const item = buildResumen({
      ultimaDecision: buildUltimaDecision({ confianza: 40 }),
    });
    expect(colaBucket(item)).toBe("te_necesitan");
  });

  it("intención menciona compra en texto libre → te_necesitan", () => {
    const item = buildResumen({
      ultimaDecision: buildUltimaDecision({ intencion: "quiere comprar un juego de sala" }),
    });
    expect(colaBucket(item)).toBe("te_necesitan");
  });

  it("conversación limpia sin señales → al_dia", () => {
    const item = buildResumen({
      estado: "contactado",
      ultimaDecision: buildUltimaDecision({
        confianza: 95,
        accion: "responder",
        resultado: "propuesto",
        razonEscalamiento: "",
        intencion: "agradece el mensaje",
      }),
    });
    expect(colaBucket(item)).toBe("al_dia");
  });

  it("sin ultimaDecision y estado no escalado → al_dia", () => {
    const item = buildResumen({ estado: "contactado", ultimaDecision: null });
    expect(colaBucket(item)).toBe("al_dia");
  });
});

describe("confianzaBinaria", () => {
  it("64 → baja", () => {
    expect(confianzaBinaria(64)).toBe("baja");
  });

  it("65 → alta", () => {
    expect(confianzaBinaria(65)).toBe("alta");
  });

  it("0 → baja", () => {
    expect(confianzaBinaria(0)).toBe("baja");
  });

  it("100 → alta", () => {
    expect(confianzaBinaria(100)).toBe("alta");
  });
});

describe("modoConversacion", () => {
  it("conversación escalada → briefing", () => {
    const detalle = buildDetalle({
      estado: "escalado",
      decisiones: [buildDecision({ accion: "responder", resultado: "propuesto" })],
    });
    expect(modoConversacion(detalle)).toBe("briefing");
  });

  it("newest.accion escalar → briefing (aunque el estado no diga escalado)", () => {
    const detalle = buildDetalle({
      estado: "conversando",
      decisiones: [buildDecision({ accion: "escalar", resultado: "escalado" })],
    });
    expect(modoConversacion(detalle)).toBe("briefing");
  });

  it("newest.resultado escalado → briefing", () => {
    const detalle = buildDetalle({
      estado: "conversando",
      decisiones: [buildDecision({ accion: "responder", resultado: "escalado" })],
    });
    expect(modoConversacion(detalle)).toBe("briefing");
  });

  it("newest responder+propuesto+borrador no vacío → borrador", () => {
    const detalle = buildDetalle({
      estado: "respondio",
      decisiones: [
        buildDecision({ accion: "responder", resultado: "propuesto", borrador: "hola, con gusto" }),
      ],
    });
    expect(modoConversacion(detalle)).toBe("borrador");
  });

  it("newest responder+propuesto pero borrador vacío → ninguno", () => {
    const detalle = buildDetalle({
      estado: "respondio",
      decisiones: [buildDecision({ accion: "responder", resultado: "propuesto", borrador: "" })],
    });
    expect(modoConversacion(detalle)).toBe("ninguno");
  });

  it("newest resultado aprobado → ninguno", () => {
    const detalle = buildDetalle({
      estado: "respondio",
      decisiones: [buildDecision({ accion: "responder", resultado: "aprobado" })],
    });
    expect(modoConversacion(detalle)).toBe("ninguno");
  });

  it("sin decisiones y estado no escalado → ninguno", () => {
    const detalle = buildDetalle({ estado: "contactado", decisiones: [] });
    expect(modoConversacion(detalle)).toBe("ninguno");
  });

  it("sin decisiones pero estado escalado → briefing", () => {
    const detalle = buildDetalle({ estado: "escalado", decisiones: [] });
    expect(modoConversacion(detalle)).toBe("briefing");
  });

  it("usa la ÚLTIMA decisión (más reciente), no la primera", () => {
    const detalle = buildDetalle({
      estado: "respondio",
      decisiones: [
        buildDecision({ accion: "escalar", resultado: "escalado" }),
        buildDecision({ accion: "responder", resultado: "propuesto", borrador: "hola" }),
      ],
    });
    expect(modoConversacion(detalle)).toBe("borrador");
  });
});

describe("estadoLabel", () => {
  it.each([
    ["contactado", "Contactado"],
    ["respondio", "Respondió"],
    ["conversando", "Conversando"],
    ["escalado", "Escalada"],
    ["interesado", "Interesado"],
    ["enganche", "Enganche"],
    ["descartado", "Descartado"],
  ])("%s → %s", (estado, expected) => {
    expect(estadoLabel(estado)).toBe(expected);
  });

  it("valor desconocido pasa tal cual (fallback)", () => {
    expect(estadoLabel("otro_estado")).toBe("otro_estado");
  });
});

describe("segmentoLabel", () => {
  it("recien_liquidado → recién liq.", () => {
    expect(segmentoLabel("recien_liquidado")).toBe("recién liq.");
  });

  it("por_liquidar_hueco → por liquidar", () => {
    expect(segmentoLabel("por_liquidar_hueco")).toBe("por liquidar");
  });

  it("valor desconocido pasa tal cual (fallback)", () => {
    expect(segmentoLabel("otro_segmento")).toBe("otro_segmento");
  });
});
