import { describe, it, expect } from "vitest";
import { asignarRolAUsuario } from "./asignarRolAUsuario";
import { FakeUsuariosRolesPort } from "../__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../domain/errors";

describe("asignarRolAUsuario", () => {
  it("forwards usuarioId and rolId to the port", async () => {
    const port = new FakeUsuariosRolesPort();

    await asignarRolAUsuario(port, "usr-1", "rol-2");

    expect(port.asignarRolAUsuarioCalls).toEqual([
      { usuarioId: "usr-1", rolId: "rol-2", signal: undefined },
    ]);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeUsuariosRolesPort();
    const ctrl = new AbortController();

    await asignarRolAUsuario(port, "usr-1", "rol-2", ctrl.signal);

    expect(port.asignarRolAUsuarioCalls[0].signal).toBe(ctrl.signal);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeUsuariosRolesPort();
    const err = new DomainError("rol_not_found", "rol no encontrado");
    port.throwOnNext.asignarRolAUsuario = err;

    await expect(asignarRolAUsuario(port, "usr-1", "rol-2")).rejects.toBe(err);
  });
});
