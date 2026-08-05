import { describe, it, expect } from "vitest";
import { domainToRolBody } from "../domainToRolBody";

describe("domainToRolBody", () => {
  it("incluye solo nombre cuando description no se toca (undefined)", () => {
    const body = domainToRolBody({ nombre: "cobrador" });

    expect(body).toEqual({ nombre: "cobrador" });
    expect("description" in body).toBe(false);
  });

  it("envía description como string cuando el caller la define", () => {
    const body = domainToRolBody({ nombre: "cobrador", description: "cobra en ruta" });

    expect(body).toEqual({ nombre: "cobrador", description: "cobra en ruta" });
  });

  it("envía null explícito cuando el caller limpia la descripción deliberadamente", () => {
    const body = domainToRolBody({ nombre: "cobrador", description: null });

    expect(body).toEqual({ nombre: "cobrador", description: null });
  });
});
