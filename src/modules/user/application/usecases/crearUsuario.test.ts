import { describe, it, expect } from "vitest";
import { crearUsuario } from "./crearUsuario";
import { FakeUserPort, makeFakeUsuario } from "../__tests__/fakeUserPort";
import { DomainError } from "../../domain/errors";

const INPUT = {
  firebaseUid: "fbuid-brenda",
  email: "brenda.sanchez@muebleriamsp.mx",
  nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
};

describe("crearUsuario", () => {
  it("reenvía el input al puerto y devuelve su resultado", async () => {
    const port = new FakeUserPort();
    port.crearUsuarioResponse = makeFakeUsuario({
      id: "usr-brenda",
      firebaseUid: "fbuid-brenda",
    });

    const result = await crearUsuario(port, { ...INPUT, telefono: "4431122334" });

    expect(port.crearUsuarioCalls).toEqual([
      { input: { ...INPUT, telefono: "4431122334" }, signal: undefined },
    ]);
    expect(result.id).toBe("usr-brenda");
    expect(result.firebaseUid).toBe("fbuid-brenda");
  });

  it("no inventa un teléfono cuando el input no lo trae", async () => {
    const port = new FakeUserPort();

    await crearUsuario(port, INPUT);

    expect(port.crearUsuarioCalls[0].input).toEqual(INPUT);
    expect(port.crearUsuarioCalls[0].input.telefono).toBeUndefined();
  });

  it("propaga el abort signal al puerto", async () => {
    const port = new FakeUserPort();
    const ctrl = new AbortController();

    await crearUsuario(port, INPUT, ctrl.signal);

    expect(port.crearUsuarioCalls[0].signal).toBe(ctrl.signal);
  });

  it("propaga los errores del puerto sin envolverlos", async () => {
    const port = new FakeUserPort();
    const err = new DomainError("usuario_ya_existe", "ya existe un usuario con ese correo");
    port.throwOnNext.crearUsuario = err;

    await expect(crearUsuario(port, INPUT)).rejects.toBe(err);
  });
});
