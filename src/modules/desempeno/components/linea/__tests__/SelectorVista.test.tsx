import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectorVista } from "../SelectorVista";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { CLAVE_VISTA_LINEA } from "../../../presentation/preferencias";

describe("SelectorVista (D16)", () => {
  beforeEach(() => localStorage.clear());

  it("Bloques viene marcado por defecto", () => {
    renderConDesempeno(<SelectorVista />);
    expect(screen.getByRole("button", { name: "Bloques de trabajo" })).toHaveAttribute("aria-pressed", "true");
  });

  it("elegir otra vista la marca y la recuerda en esta computadora", async () => {
    const user = userEvent.setup();
    renderConDesempeno(<SelectorVista />);
    await user.click(screen.getByRole("button", { name: "Por hora" }));
    expect(screen.getByRole("button", { name: "Por hora" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(CLAVE_VISTA_LINEA)).toBe(JSON.stringify("por_hora"));
  });

  it("cada botón explica su vista al pasar el ratón", async () => {
    const user = userEvent.setup();
    renderConDesempeno(<SelectorVista />);
    await user.hover(screen.getByRole("button", { name: "Bloques + hora" }));
    expect(await screen.findByText("Tramos de trabajo con barras por hora encima")).toBeInTheDocument();
  });
});
