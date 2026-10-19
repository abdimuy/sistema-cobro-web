import { describe, expect, it } from "vitest";
import { textoDeCompromiso, tonoDeCompromiso } from "../compromiso";
import { pesosDeCentavos, diaMes } from "../format";
import { makeCompromiso } from "../../../application/__tests__/fakeDesempenoPort";
import { ESTADOS_COMPROMISO } from "../../../domain/entities";

// Visitas P2, Tarea 21: el texto sale del estado que manda el servidor; aquí
// solo se rotula (nunca se compara el día con hoy).
describe("textoDeCompromiso", () => {
  it.each([
    [makeCompromiso(), "Promesa 20 oct · $150"],
    [makeCompromiso({ estado: "vigente_hoy", montoCentavos: 15050 }), "Promesa 20 oct · $150.50"],
    [makeCompromiso({ montoCentavos: null }), "Promesa 20 oct"],
    [makeCompromiso({ tipo: "cita", dia: "2026-10-18", hora: "16:30", montoCentavos: null }), "Cita 18 oct 16:30"],
    [makeCompromiso({ tipo: "cita", dia: "2026-10-18", hora: null, montoCentavos: null }), "Cita 18 oct"],
    [makeCompromiso({ estado: "incumplida", dia: "2026-10-12" }), "Incumplida 12 oct"],
    [makeCompromiso({ tipo: "cita", estado: "incumplida", dia: "2026-10-12", hora: "09:00" }), "Cita incumplida 12 oct"],
    [makeCompromiso({ estado: "cumplida" }), "Cumplida 20 oct"],
    [makeCompromiso({ tipo: "cita", estado: "cita_cumplida", dia: "2026-10-18" }), "Cita cumplida 18 oct"],
  ])("%o → %s", (c, texto) => {
    expect(textoDeCompromiso(c)).toBe(texto);
  });

  it("cerrada_sin_cumplir no se pinta", () => {
    expect(textoDeCompromiso(makeCompromiso({ estado: "cerrada_sin_cumplir" }))).toBeNull();
    expect(textoDeCompromiso(makeCompromiso({ tipo: "cita", estado: "cerrada_sin_cumplir" }))).toBeNull();
  });

  // El escritorio no deriva: un estado "vigente_futura" con un día ya pasado
  // se pinta como lo mandó el servidor, y uno "incumplida" con día futuro también.
  it("respeta el estado del servidor aunque el día diga otra cosa", () => {
    expect(textoDeCompromiso(makeCompromiso({ dia: "2020-01-02" }))).toBe("Promesa 2 ene · $150");
    expect(textoDeCompromiso(makeCompromiso({ estado: "incumplida", dia: "2099-12-31" }))).toBe("Incumplida 31 dic");
  });

  it("todo estado del contrato tiene tono; ningún texto dice ciclo", () => {
    for (const estado of ESTADOS_COMPROMISO) {
      for (const tipo of ["promesa", "cita"] as const) {
        const c = makeCompromiso({ estado, tipo, hora: tipo === "cita" ? "16:30" : null });
        expect(tonoDeCompromiso(c)).toBeTruthy();
        expect(textoDeCompromiso(c) ?? "").not.toMatch(/ciclo/i);
      }
    }
  });
});

describe("formato de compromiso", () => {
  it("pesosDeCentavos sin pasar por flotantes", () => {
    expect(pesosDeCentavos(15000)).toBe("$150");
    expect(pesosDeCentavos(15005)).toBe("$150.05");
    expect(pesosDeCentavos(1250000)).toBe("$12,500");
    expect(pesosDeCentavos(0)).toBe("$0");
    expect(pesosDeCentavos(7)).toBe("$0.07");
  });

  it("diaMes", () => {
    expect(diaMes("2026-10-20")).toBe("20 oct");
    expect(diaMes("2026-01-02")).toBe("2 ene");
  });
});
