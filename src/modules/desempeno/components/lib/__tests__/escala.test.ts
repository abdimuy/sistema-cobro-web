import { describe, expect, it } from "vitest";
import { ancho, minutosDelDia, posicion, posicionHorario } from "../escala";

describe("eje 7:00–20:00 en hora de la oficina", () => {
  it("minutos del día en CDMX, no en UTC", () => {
    expect(minutosDelDia("2026-10-14T14:20:00Z")).toBe(8 * 60 + 20);
  });

  it("posición en porcentaje del eje", () => {
    // 08:20 → (500 − 420) / 780 = 10.256 %
    expect(posicion("2026-10-14T14:20:00Z")).toBeCloseTo(10.256, 2);
    expect(posicionHorario("08:00")).toBeCloseTo(7.692, 2);
  });

  it("lo que cae fuera del eje se pega al borde (nunca se sale ni se voltea)", () => {
    expect(posicion("2026-10-14T12:00:00Z")).toBe(0); // 06:00
    expect(posicion("2026-10-15T03:00:00Z")).toBe(100); // 21:00
    expect(posicion("2026-10-15T05:30:00Z")).toBe(100); // 23:30, no 05:30
  });

  it("ancho de un tramo", () => {
    // 09:10 → 10:22 = 72 min de 780
    expect(ancho("2026-10-14T15:10:00Z", "2026-10-14T16:22:00Z")).toBeCloseTo(9.231, 2);
  });
});
