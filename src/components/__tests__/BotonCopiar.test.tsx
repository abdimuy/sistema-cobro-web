import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BotonCopiar } from "../BotonCopiar";

afterEach(() => vi.restoreAllMocks());

describe("BotonCopiar", () => {
  it("copia el nombre, no dispara el clic de la fila y muestra 'Copiado'", async () => {
    const user = userEvent.setup();
    const escribir = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const alClicFila = vi.fn();
    render(
      <div onClick={alClicFila} className="group">
        <BotonCopiar texto="MARÍA ELENA CUAUTLE" />
      </div>,
    );
    const boton = screen.getByRole("button", { name: "Copiar nombre del cliente" });
    expect(boton).toHaveAttribute("title", "Copiar nombre");
    await user.click(boton);
    expect(escribir).toHaveBeenCalledWith("MARÍA ELENA CUAUTLE");
    expect(alClicFila).not.toHaveBeenCalled();
    expect(boton).toHaveAttribute("title", "Copiado");
  });

  it("si el portapapeles falla no dice 'Copiado'", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denegado"));
    render(<BotonCopiar texto="X" />);
    const boton = screen.getByRole("button", { name: "Copiar nombre del cliente" });
    await user.click(boton);
    expect(boton).toHaveAttribute("title", "Copiar nombre");
  });
});
