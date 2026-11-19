import { describe, expect, it } from "vitest";
import {
  direccionCompleta,
  fechaHoraOficina,
  lineaSoloConsulta,
} from "./formatoArchivo";

describe("formatoArchivo", () => {
  it("fechaHoraOficina convierte 2026-02-03T22:05:00Z a '03/02/2026 16:05'", () => {
    expect(fechaHoraOficina("2026-02-03T22:05:00Z")).toBe("03/02/2026 16:05");
  });

  it("fechaHoraOficina no lanza con una fecha inválida", () => {
    expect(fechaHoraOficina("basura")).toBe("—");
  });

  it("direccionCompleta omite número y colonia vacíos sin dejar comas sueltas", () => {
    expect(
      direccionCompleta({
        direccion: "AV JUAREZ",
        numero_exterior: "",
        colonia: "",
        poblacion: "PUEBLA",
        ciudad: "",
      }),
    ).toBe("AV JUAREZ, PUEBLA");
  });

  it("direccionCompleta une calle y número con espacio", () => {
    expect(
      direccionCompleta({
        direccion: "AV JUAREZ",
        numero_exterior: "12",
        colonia: "CENTRO",
        poblacion: "",
        ciudad: "PUEBLA",
      }),
    ).toBe("AV JUAREZ 12, CENTRO, PUEBLA");
  });

  it("direccionCompleta sin datos devuelve —", () => {
    expect(
      direccionCompleta({
        direccion: "",
        numero_exterior: "",
        colonia: "",
        poblacion: "",
        ciudad: "",
      }),
    ).toBe("—");
  });

  it("lineaSoloConsulta arma la línea exacta", () => {
    expect(
      lineaSoloConsulta({
        fecha_venta: "2026-02-03T22:05:00Z",
        capturada_por: "Ana",
      }),
    ).toBe(
      "Venta del sistema anterior · solo consulta · capturada el 03/02/2026 16:05 por Ana",
    );
  });
});
