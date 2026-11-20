import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { Coincidencia } from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";
import { CoincidenciaLinea } from "./CoincidenciaLinea";

const c = (campo: Coincidencia["campo"], antes: string, hit: string, aproximada = false): Coincidencia => ({
  campo,
  segmentos: [
    { texto: antes, coincide: false },
    { texto: hit, coincide: true },
  ],
  aproximada,
  recortado: false,
});
const v = (cs: Coincidencia[], extra: Partial<VentaLocal> = {}) =>
  ({ COINCIDENCIAS: cs, DIRECCION: "Calle Roble s/n", ...extra }) as VentaLocal;
const visibles = ["cliente", "telefono"] as ColumnId[];

describe("CoincidenciaLinea", () => {
  it("sin búsqueda (sin coincidencias) no pinta nada", () => {
    const { container } = render(<CoincidenciaLinea venta={v([])} visibleColumns={visibles} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("una sola línea con la primera oculta, +N y sin etiquetas", () => {
    render(
      <CoincidenciaLinea
        venta={v([c("direccion", "Calle ", "Roble"), c("articulos", "Comedor 4 sillas ", "Roble")])}
        visibleColumns={visibles}
      />,
    );
    const linea = screen.getByTestId("coincidencia-linea");
    expect(linea.className).toContain("h-[18px]");
    expect(linea.className).toContain("whitespace-nowrap");
    expect(linea).toHaveTextContent("Calle Roble");
    expect(linea).toHaveTextContent("+1");
    expect(linea).not.toHaveTextContent("Comedor");
    expect(linea.querySelector(".coincide-chip:not(.coincide-chip-aprox)")).toBeNull();
  });

  it("al enfocar abre la tarjeta con todas las coincidencias completas", async () => {
    const user = userEvent.setup();
    render(
      <CoincidenciaLinea
        venta={v([c("direccion", "Calle ", "Roble"), c("articulos", "Comedor 4 sillas ", "Roble")])}
        visibleColumns={visibles}
      />,
    );
    await user.tab();
    expect(await screen.findByText("Coincide en 2 campos")).toBeInTheDocument();
    expect(screen.getByText("Artículos")).toBeInTheDocument();
    expect(screen.getByText("Comedor 4 sillas")).toBeInTheDocument();
  });

  it("si sólo coincide en columnas visibles muestra la dirección en gris, sin tarjeta", () => {
    render(<CoincidenciaLinea venta={v([c("cliente", "MARIA ", "GARCIA")])} visibleColumns={visibles} />);
    expect(screen.getByTestId("coincidencia-linea")).toHaveTextContent("Calle Roble s/n");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("aprox. se muestra como chip pequeño dentro de la misma línea", () => {
    render(
      <CoincidenciaLinea
        venta={v([c("cliente", "ROSA ", "GRACIA", true)], { APROXIMADA_DETALLE: "Escribiste “garcia”" })}
        visibleColumns={visibles}
      />,
    );
    const chip = screen.getByText("aprox.");
    expect(chip.getAttribute("title")).toBe("Escribiste “garcia”");
    expect(screen.getByTestId("coincidencia-linea")).toContainElement(chip);
  });
});
