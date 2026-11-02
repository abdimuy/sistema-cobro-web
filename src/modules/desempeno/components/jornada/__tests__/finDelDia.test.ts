import { describe, expect, it } from "vitest";
import { finDelDiaTerminado } from "../finDelDia";

const horario = { desdeHora: "08:00", hastaHora: "18:00" };
// 2026-10-14T18:18:00Z = 12:18 en CDMX; 2026-10-15T01:00:00Z = 19:00 del 14.
const MEDIODIA = "2026-10-14T18:18:00Z";
const NOCHE = "2026-10-15T01:00:00Z";

describe("finDelDiaTerminado (sólo campos del servidor)", () => {
  it("día anterior a hoy -> Fin del día", () => {
    expect(finDelDiaTerminado({ fecha: "2026-10-13", hoy: "2026-10-14", generadoAt: MEDIODIA, horario: null })).toBe(true);
  });
  it("hoy antes del fin del horario -> Última actividad", () => {
    expect(finDelDiaTerminado({ fecha: "2026-10-14", hoy: "2026-10-14", generadoAt: MEDIODIA, horario })).toBe(false);
  });
  it("hoy después del fin del horario -> Fin del día", () => {
    expect(finDelDiaTerminado({ fecha: "2026-10-14", hoy: "2026-10-14", generadoAt: NOCHE, horario })).toBe(true);
  });
  it("hoy sin horario -> Última actividad", () => {
    expect(finDelDiaTerminado({ fecha: "2026-10-14", hoy: "2026-10-14", generadoAt: NOCHE, horario: null })).toBe(false);
  });
});
