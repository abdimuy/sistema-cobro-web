import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoRapida, TarjetaFilas, TarjetaTitulo } from "../InfoRapida";

function Ejemplo() {
  return (
    <InfoRapida
      contenido={
        <>
          <TarjetaTitulo>Pagos de hoy</TarjetaTitulo>
          <TarjetaFilas filas={[["Efectivo", "28 · $7,800"]]} />
        </>
      }
    >
      <span tabIndex={0}>$8,600</span>
    </InfoRapida>
  );
}

describe("InfoRapida (popover de información rápida, D17)", () => {
  it("no monta el contenido hasta que se pide", () => {
    render(<Ejemplo />);
    expect(screen.queryByText("Pagos de hoy")).not.toBeInTheDocument();
  });

  it("se abre con el ratón", async () => {
    const user = userEvent.setup();
    render(<Ejemplo />);
    await user.hover(screen.getByText("$8,600"));
    expect(await screen.findByText("Pagos de hoy")).toBeInTheDocument();
    expect(screen.getByText("28 · $7,800")).toBeInTheDocument();
  });

  it("se abre con el teclado cuando el disparador es enfocable", async () => {
    const user = userEvent.setup();
    render(<Ejemplo />);
    await user.tab();
    expect(screen.getByText("$8,600")).toHaveFocus();
    expect(await screen.findByText("Pagos de hoy")).toBeInTheDocument();
  });
});
