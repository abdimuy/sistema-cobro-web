import { describe, it, expect } from "vitest";
import { domainToCrearUsuarioBody } from "../domainToCrearUsuarioBody";

const INPUT = {
  firebaseUid: "fbuid-brenda",
  email: "brenda.sanchez@muebleriamsp.mx",
  nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
};

describe("domainToCrearUsuarioBody", () => {
  it("mapea a snake_case", () => {
    expect(domainToCrearUsuarioBody({ ...INPUT, telefono: "4431122334" })).toEqual({
      firebase_uid: "fbuid-brenda",
      email: "brenda.sanchez@muebleriamsp.mx",
      nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
      telefono: "4431122334",
    });
  });

  it("recorta el teléfono", () => {
    const body = domainToCrearUsuarioBody({ ...INPUT, telefono: " 4431122334 " });
    expect(body.telefono).toBe("4431122334");
  });

  it.each([
    ["ausente", undefined],
    ["null", null],
    ["vacío", ""],
    ["sólo espacios", "   "],
  ])("omite la clave telefono cuando viene %s", (_caso, telefono) => {
    const body = domainToCrearUsuarioBody({ ...INPUT, telefono });
    expect("telefono" in body).toBe(false);
  });
});
