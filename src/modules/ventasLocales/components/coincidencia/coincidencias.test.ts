import { describe, expect, it } from "vitest";
import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { Coincidencia } from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";
import {
  coincidenciasOcultas,
  columnaDelBloque,
  motivosDe,
  segmentosSobreFormato,
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

describe("segmentosSobreFormato", () => {
  const sg = (texto: string, coincide: boolean) => ({ texto, coincide });

  it("12 dígitos (prefijo 52) sin formato: conserva el resaltado del prefijo", () => {
    const out = segmentosSobreFormato(
      [sg("52", true), sg("1234567890", false)],
      "521234567890",
    );
    expect(out).toEqual([sg("52", true), sg("1234567890", false)]);
  });

  it("si la cantidad de dígitos no cuadra devuelve los segmentos tal cual", () => {
    const segs = [sg("331", true), sg("23", false)];
    expect(segmentosSobreFormato(segs, "(331) 234-5678")).toBe(segs);
  });

  it("segmentos parciales: el separador solo se resalta si ambos lados coinciden", () => {
    const out = segmentosSobreFormato(
      [sg("33", true), sg("12345678", false)],
      "(331) 234-5678",
    );
    expect(out).toEqual([sg("(", false), sg("33", true), sg("1) 234-5678", false)]);
    expect(out.map((x) => x.texto).join("")).toBe("(331) 234-5678");
  });

  it("coincidencia total resalta también los separadores internos", () => {
    const out = segmentosSobreFormato([sg("3312345678", true)], "(331) 234-5678");
    expect(out).toEqual([sg("(", false), sg("331) 234-5678", true)]);
  });
});
