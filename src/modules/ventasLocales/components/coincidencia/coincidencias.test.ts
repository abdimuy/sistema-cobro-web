import { describe, expect, it } from "vitest";
import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { Coincidencia } from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";
import {
  coincidenciasOcultas,
  columnaDelBloque,
  ventanaAlrededor,
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
  it("ventanaAlrededor recorta antes de la coincidencia con … y sin media palabra", () => {
    const r = ventanaAlrededor([
      { texto: "C PLUTARCO ELIAS ", coincide: false },
      { texto: "CALLES", coincide: true },
      { texto: " COL CENTRO", coincide: false },
    ], 10);
    expect(r[0]).toEqual({ texto: "…ELIAS ", coincide: false });
    expect(r[1]).toEqual({ texto: "CALLES", coincide: true });
  });

  it("ventanaAlrededor no toca textos cortos ni los que empiezan con la coincidencia", () => {
    const corto = [{ texto: "C ", coincide: false }, { texto: "CALLE", coincide: true }];
    expect(ventanaAlrededor(corto)).toBe(corto);
    const inicio = [{ texto: "CALLE", coincide: true }, { texto: " 5", coincide: false }];
    expect(ventanaAlrededor(inicio)).toBe(inicio);
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
