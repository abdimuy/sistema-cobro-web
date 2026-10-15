import { describe, expect, it } from "vitest";
import {
  diaDeNegocioDe,
  diasEntre,
  dinero,
  dinero2,
  duracion,
  duracionCorta,
  entero,
  fechaCorta,
  fechaLarga,
  horaCorta,
  hoyDeNegocio,
  plural,
  porcentaje,
  primerNombre,
  sinAcentos,
  sumarDias,
  textoInicioSemana,
} from "../format";

// La suite corre con TZ=UTC: si estas funciones usaran el reloj del
// navegador, "16:31Z" saldría "16:31" y no "10:31".
describe("horas en el reloj del negocio (America/Mexico_City)", () => {
  it("convierte UTC a la hora de la oficina", () => {
    expect(horaCorta("2026-10-14T16:31:00Z")).toBe("10:31");
  });

  it("de madrugada en UTC sigue siendo la noche del día anterior en CDMX", () => {
    expect(horaCorta("2026-10-15T05:30:00Z")).toBe("23:30");
    expect(diaDeNegocioDe("2026-10-15T05:30:00Z")).toBe("2026-10-14");
    expect(hoyDeNegocio(new Date("2026-10-15T03:00:00Z"))).toBe("2026-10-14");
  });
});

describe("días de calendario", () => {
  it("nombres en español sin depender de Intl", () => {
    expect(fechaLarga("2026-10-14")).toBe("miércoles 14 de octubre");
    expect(fechaCorta("2026-10-09")).toBe("vie 9 oct");
  });

  it("suma días sobre el calendario y enumera rangos inclusivos", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDias("2026-10-01", -1)).toBe("2026-09-30");
    expect(diasEntre("2026-10-09", "2026-10-14")).toEqual([
      "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14",
    ]);
    expect(diasEntre("2026-10-14", "2026-10-13")).toEqual([]);
  });
});

describe("duraciones, dinero y textos", () => {
  it("duraciones legibles", () => {
    expect(duracion(72)).toBe("1 h 12 min");
    expect(duracion(45)).toBe("45 min");
    expect(duracion(120)).toBe("2 h");
    expect(duracionCorta(65)).toBe("1 h 05");
    expect(duracionCorta(30)).toBe("30 min");
  });

  it("dinero desde el decimal en string, sin tocar el valor", () => {
    expect(dinero("8600.00")).toBe("$8,600");
    expect(dinero2("150.00")).toBe("$150.00");
    expect(dinero("no-numero")).toBe("no-numero");
  });

  it("porcentajes, enteros y plurales", () => {
    expect(porcentaje("65.90")).toBe("65.9%");
    expect(porcentaje(null)).toBe("—");
    expect(entero(1188)).toBe("1,188");
    expect(plural(1, "pago", "pagos")).toBe("1 pago");
    expect(plural(3, "pago", "pagos")).toBe("3 pagos");
  });

  it("búsqueda sin acentos y nombre corto", () => {
    expect(sinAcentos("Méndez ÁVILA")).toBe("mendez avila");
    expect(primerNombre("Juan Carlos Méndez")).toBe("Juan Carlos");
  });
});

describe("textoInicioSemana (fecha y hora de la oficina)", () => {
  it("mismo día: hace 0 d", () => {
    expect(textoInicioSemana("2026-10-15T14:12:00Z", "2026-10-15")).toBe(
      "Semana desde jue 15 oct, 08:12 · hace 0 d",
    );
  });

  it("la hora y el día son los de CDMX, no los de UTC", () => {
    // 03:00Z del sábado = 21:00 del viernes en la oficina.
    expect(textoInicioSemana("2026-10-10T03:00:00Z", "2026-10-14")).toBe(
      "Semana desde vie 9 oct, 21:00 · hace 5 d",
    );
  });

  it("un inicio después de hoy no dice \"hace\"", () => {
    expect(textoInicioSemana("2026-10-16T14:00:00Z", "2026-10-15")).toBe(
      "Semana desde vie 16 oct, 08:00",
    );
  });
});
