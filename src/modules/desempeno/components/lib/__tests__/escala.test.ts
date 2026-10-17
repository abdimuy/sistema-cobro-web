import { describe, expect, it } from "vitest";
import { EJE_POR_OMISION, escalaDe, minutosDelDia } from "../escala";

const e720 = escalaDe(EJE_POR_OMISION);

describe("escala del eje que manda el servidor (E-INF-018)", () => {
  it("minutos del día en CDMX, no en UTC", () => {
    expect(minutosDelDia("2026-10-14T14:20:00Z")).toBe(8 * 60 + 20);
  });

  it("posición en porcentaje del eje 7–20", () => {
    // 08:20 → (500 − 420) / 780 = 10.256 %
    expect(e720.posicion("2026-10-14T14:20:00Z")).toBeCloseTo(10.256, 2);
    expect(e720.posicionHorario("08:00")).toBeCloseTo(7.692, 2);
  });

  it("lo que cae fuera del eje se pega al borde (nunca se sale ni se voltea)", () => {
    expect(e720.posicion("2026-10-14T12:00:00Z")).toBe(0); // 06:00
    expect(e720.posicion("2026-10-15T03:00:00Z")).toBe(100); // 21:00
    expect(e720.posicion("2026-10-15T05:30:00Z")).toBe(100); // 23:30, no 05:30
  });

  it("ancho de un tramo", () => {
    // 09:10 → 10:22 = 72 min de 780
    expect(e720.ancho("2026-10-14T15:10:00Z", "2026-10-14T16:22:00Z")).toBeCloseTo(9.231, 2);
  });

  it("con eje 5–22 una actividad a las 05:30 ya no se pega al borde", () => {
    const e = escalaDe({ desdeHora: 5, hastaHora: 22 });
    expect(e.posicionMinutos(5 * 60 + 30)).toBeCloseTo((30 / (17 * 60)) * 100, 5);
    expect(e.posicionMinutos(4 * 60)).toBe(0);
    expect(e.posicionMinutos(23 * 60)).toBe(100);
  });

  it("el eje por omisión reproduce el 7–20 de antes", () => {
    expect(e720.posicionMinutos(7 * 60)).toBe(0);
    expect(e720.posicionMinutos(20 * 60)).toBe(100);
    expect(e720.marcas).toEqual([7, 10, 13, 16, 19]);
  });

  it("marcas cada 3 h desde el inicio del eje, más la última hora si falta", () => {
    expect(escalaDe({ desdeHora: 5, hastaHora: 22 }).marcas).toEqual([5, 8, 11, 14, 17, 20, 21]);
  });
});
