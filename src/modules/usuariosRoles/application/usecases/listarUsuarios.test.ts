import { describe, it, expect } from "vitest";
import { listarUsuarios } from "./listarUsuarios";
import {
  FakeUsuariosRolesPort,
  makeFakeUsuario,
} from "../__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../domain/errors";

describe("listarUsuarios", () => {
  it("delegates to the port and returns its result", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarUsuariosResponse = [makeFakeUsuario()];

    const result = await listarUsuarios(port);

    expect(port.listarUsuariosCalls).toHaveLength(1);
    expect(result).toEqual([makeFakeUsuario()]);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeUsuariosRolesPort();
    const ctrl = new AbortController();

    await listarUsuarios(port, ctrl.signal);

    expect(port.listarUsuariosCalls[0].signal).toBe(ctrl.signal);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeUsuariosRolesPort();
    const err = new DomainError("forbidden", "no tienes permisos");
    port.throwOnNext.listarUsuarios = err;

    await expect(listarUsuarios(port)).rejects.toBe(err);
  });
});
