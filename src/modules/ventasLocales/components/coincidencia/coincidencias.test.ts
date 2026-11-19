import { describe, expect, it } from "vitest";
import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { Coincidencia } from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";
import {
  coincidenciasOcultas,
  columnaDelBloque,
  motivosDe,
} from "./coincidencias";

const c = (campo: string): Coincidencia =>
  ({
    campo,
    segmentos: [{ texto: "a", coincide: true }],
    aproximada: false,
    recortado: false,
  }) as Coincidencia;
const v = (...campos: string[]) =>
  ({ COINCIDENCIAS: campos.map(c) }) as VentaLocal;

describe("coincidencias", () => {
  it("motivosDe omite cliente y respeta el orden del contrato", () => {
    expect(motivosDe(v("articulos", "cliente", "telefono", "folio"))).toEqual([
      "telefono",
      "folio",
      "articulos",
    ]);
  });

  it("motivosDe ignora campos desconocidos y duplicados", () => {
    expect(motivosDe(v("vendedor", "folio", "folio"))).toEqual(["folio"]);
  });

  it("coincidenciasOcultas incluye articulos siempre (no es columna)", () => {
    const todas: ColumnId[] = [
      "cliente",
      "telefono",
      "microsipFolio",
      "direccion",
    ];
    expect(
      coincidenciasOcultas(v("articulos"), todas).map((x) => x.campo),
    ).toEqual(["articulos"]);
  });

  it("coincidenciasOcultas incluye direccion solo si la columna direccion no está visible", () => {
    expect(coincidenciasOcultas(v("direccion"), ["cliente"])).toHaveLength(1);
    expect(
      coincidenciasOcultas(v("direccion"), ["cliente", "direccion"]),
    ).toHaveLength(0);
  });

  it("columnaDelBloque cae a la primera columna visible si cliente está oculta", () => {
    expect(columnaDelBloque(["telefono", "cliente"])).toBe("cliente");
    expect(columnaDelBloque(["telefono", "folio" as ColumnId])).toBe(
      "telefono",
    );
  });

  it("columnaDelBloque con 0 columnas visibles devuelve undefined", () => {
    expect(columnaDelBloque([])).toBeUndefined();
  });
});
