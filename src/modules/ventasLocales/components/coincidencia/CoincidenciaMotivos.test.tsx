import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { Coincidencia } from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";
import { CoincidenciaMotivos } from "./CoincidenciaMotivos";

const c = (
  campo: Coincidencia["campo"],
  texto = "x",
  aproximada = false,
): Coincidencia => ({
  campo,
  segmentos: [
    { texto: "ab ", coincide: false },
    { texto, coincide: true },
  ],
  aproximada,
  recortado: false,
});
const v = (cs: Coincidencia[], extra: Partial<VentaLocal> = {}) =>
  ({ COINCIDENCIAS: cs, ...extra }) as VentaLocal;
const todas = [
  "cliente",
  "telefono",
  "microsipFolio",
  "direccion",
] as ColumnId[];

describe("CoincidenciaMotivos", () => {
  it("chip por motivo con los textos 'teléfono','folio','dirección','artículos'", () => {
    render(
      <CoincidenciaMotivos
        venta={v([c("telefono"), c("folio"), c("direccion"), c("articulos")])}
        visibleColumns={todas}
      />,
    );
    for (const t of ["teléfono", "folio", "dirección", "artículos"]) {
      expect(screen.getByText(t, { selector: ".coincide-chip" })).toBeTruthy();
    }
  });

  it("chip aprox. con title igual a aproximada_detalle", () => {
    render(
      <CoincidenciaMotivos
        venta={v([c("cliente", "Gracia", true)], {
          APROXIMADA_DETALLE: "Escribiste “garcia”",
        })}
        visibleColumns={todas}
      />,
    );
    expect(screen.getByText("aprox.").getAttribute("title")).toBe(
      "Escribiste “garcia”",
    );
  });

  it("línea 'Coincide en artículos:' con el segmento resaltado como <mark>", () => {
    const { container } = render(
      <CoincidenciaMotivos
        venta={v([c("articulos", "colchón")])}
        visibleColumns={todas}
      />,
    );
    expect(container.textContent).toContain("Coincide en artículos:");
    expect(container.querySelector("mark")?.textContent).toBe("colchón");
  });

  it("no muestra 'Coincide en dirección' si la columna dirección es visible", () => {
    const { container } = render(
      <CoincidenciaMotivos
        venta={v([c("direccion")])}
        visibleColumns={todas}
      />,
    );
    expect(container.textContent).not.toContain("Coincide en");
  });

  it("sin coincidencias no renderiza nada", () => {
    const a = render(
      <CoincidenciaMotivos venta={v([])} visibleColumns={todas} />,
    );
    expect(a.container.innerHTML).toBe("");
    const b = render(
      <CoincidenciaMotivos venta={{} as VentaLocal} visibleColumns={todas} />,
    );
    expect(b.container.innerHTML).toBe("");
  });
});
