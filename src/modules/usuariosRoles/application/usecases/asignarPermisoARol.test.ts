import { describe, it, expect } from "vitest";
import { asignarPermisoARol } from "./asignarPermisoARol";
import { FakeUsuariosRolesPort } from "../__tests__/fakeUsuariosRolesPort";

describe("asignarPermisoARol", () => {
  it("forwards rolId and codigo (with colon) to the port", async () => {
    const port = new FakeUsuariosRolesPort();

    await asignarPermisoARol(port, "rol-1", "usuarios:ver");

    expect(port.asignarPermisoARolCalls).toEqual([
      { rolId: "rol-1", codigo: "usuarios:ver", signal: undefined },
    ]);
  });
});
