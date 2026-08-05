import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { UsuariosRolesProvider, useUsuariosRolesPort } from "../UsuariosRolesContext";
import { FakeUsuariosRolesPort } from "../../../application/__tests__/fakeUsuariosRolesPort";

describe("useUsuariosRolesPort", () => {
  it("throws a clear error when used outside the provider", () => {
    expect(() => renderHook(() => useUsuariosRolesPort())).toThrowError(
      /missing <UsuariosRolesProvider>/,
    );
  });

  it("returns the port supplied by the provider", () => {
    const port = new FakeUsuariosRolesPort();
    const { result } = renderHook(() => useUsuariosRolesPort(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <UsuariosRolesProvider port={port}>{children}</UsuariosRolesProvider>
      ),
    });

    expect(result.current).toBe(port);
  });
});
