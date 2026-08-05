import { describe, it, expect } from "vitest";
import { actualizarRol } from "./actualizarRol";
import {
  FakeUsuariosRolesPort,
  makeFakeRol,
} from "../__tests__/fakeUsuariosRolesPort";

describe("actualizarRol", () => {
  it("forwards rolId and input to the port and returns its result", async () => {
    const port = new FakeUsuariosRolesPort();
    port.actualizarRolResponse = makeFakeRol({ nombre: "supervisor senior" });

    const result = await actualizarRol(port, "rol-1", {
      nombre: "supervisor senior",
      description: "actualiza la descripción",
    });

    expect(port.actualizarRolCalls).toEqual([
      {
        rolId: "rol-1",
        input: { nombre: "supervisor senior", description: "actualiza la descripción" },
        signal: undefined,
      },
    ]);
    expect(result.nombre).toBe("supervisor senior");
  });
});
