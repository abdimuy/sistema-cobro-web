import { describe, expect, it } from "vitest";
import {
  puedeEjecutarComando,
  puedeLeerGarantias,
  puedeListoEntrega,
  puedeCerrarGarantia,
} from "../permisos";

describe("Permisos de Garantías de oficina", () => {
  it("un usuario sin permisos no puede ejecutar comandos", () => {
    expect(puedeLeerGarantias([])).toBe(false);
    expect(puedeEjecutarComando([], "diagnostico")).toBe(false);
    expect(puedeEjecutarComando([], "cambio-fisico")).toBe(false);
    expect(puedeCerrarGarantia([])).toBe(false);
  });

  it("leer no autoriza modificaciones", () => {
    const permisos = ["garantias:leer"];

    expect(puedeLeerGarantias(permisos)).toBe(true);
    expect(puedeEjecutarComando(permisos, "diagnostico")).toBe(false);
    expect(puedeEjecutarComando(permisos, "desenlace")).toBe(false);
  });

  it("actualizar permite diagnóstico, dictamen y listo", () => {
    const permisos = ["garantias:actualizar"];

    expect(puedeEjecutarComando(permisos, "diagnostico")).toBe(true);
    expect(puedeEjecutarComando(permisos, "dictamen")).toBe(true);
    expect(puedeListoEntrega(permisos)).toBe(true);
    expect(puedeEjecutarComando(permisos, "cambio-fisico")).toBe(false);
  });

  it("autorizar permite cambio físico y desenlace", () => {
    const permisos = ["garantias:autorizar"];

    expect(puedeEjecutarComando(permisos, "cambio-fisico")).toBe(true);
    expect(puedeEjecutarComando(permisos, "desenlace")).toBe(true);
    expect(puedeEjecutarComando(permisos, "diagnostico")).toBe(false);
  });

  it("cerrar sólo habilita las acciones de cierre", () => {
    const permisos = ["garantias:cerrar"];

    expect(puedeCerrarGarantia(permisos)).toBe(true);
    expect(puedeEjecutarComando(permisos, "dictamen")).toBe(false);
    expect(puedeListoEntrega(permisos)).toBe(false);
  });
});
