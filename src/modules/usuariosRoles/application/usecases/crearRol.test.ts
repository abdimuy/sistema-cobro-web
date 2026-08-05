import { describe, it, expect } from "vitest";
import { crearRol } from "./crearRol";
import {
  FakeUsuariosRolesPort,
  makeFakeRol,
} from "../__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../domain/errors";

describe("crearRol", () => {
  it("forwards the input to the port and returns its result", async () => {
    const port = new FakeUsuariosRolesPort();
    port.crearRolResponse = makeFakeRol({ id: "rol-nuevo", nombre: "cobrador" });

    const result = await crearRol(port, { nombre: "cobrador", description: null });

    expect(port.crearRolCalls).toEqual([
      { input: { nombre: "cobrador", description: null }, signal: undefined },
    ]);
    expect(result.id).toBe("rol-nuevo");
    expect(result.nombre).toBe("cobrador");
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeUsuariosRolesPort();
    const ctrl = new AbortController();

    await crearRol(port, { nombre: "cobrador" }, ctrl.signal);

    expect(port.crearRolCalls[0].signal).toBe(ctrl.signal);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeUsuariosRolesPort();
    const err = new DomainError("rol_ya_existe", "ya existe un rol con ese nombre");
    port.throwOnNext.crearRol = err;

    await expect(crearRol(port, { nombre: "cobrador" })).rejects.toBe(err);
  });
});
