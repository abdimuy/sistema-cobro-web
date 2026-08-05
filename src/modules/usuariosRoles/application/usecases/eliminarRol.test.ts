import { describe, it, expect } from "vitest";
import { eliminarRol } from "./eliminarRol";
import { FakeUsuariosRolesPort } from "../__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../domain/errors";

describe("eliminarRol", () => {
  it("forwards rolId to the port", async () => {
    const port = new FakeUsuariosRolesPort();

    await eliminarRol(port, "rol-1");

    expect(port.eliminarRolCalls).toEqual([{ rolId: "rol-1", signal: undefined }]);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeUsuariosRolesPort();
    const err = new DomainError("rol_inmutable", "no se puede modificar un rol inmutable");
    port.throwOnNext.eliminarRol = err;

    await expect(eliminarRol(port, "rol-1")).rejects.toBe(err);
  });
});
