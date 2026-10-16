import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { usePuedeAdministrarConfig } from "./usePuedeAdministrarConfig";
import { FakeConfiguracionPort } from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeConfiguracionPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ConfiguracionProvider port={port}>{children}</ConfiguracionProvider>
  );
}

describe("usePuedeAdministrarConfig", () => {
  it("true sólo con config:administrar", async () => {
    const port = new FakeConfiguracionPort();
    port.listarPermisosActualesResponse = ["config:leer", "config:administrar"];
    const { result } = renderHook(() => usePuedeAdministrarConfig(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("false con sólo config:leer", async () => {
    const port = new FakeConfiguracionPort();
    port.listarPermisosActualesResponse = ["config:leer"];
    const { result } = renderHook(() => usePuedeAdministrarConfig(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(port.listarPermisosActualesCalls).toHaveLength(1));
    expect(result.current).toBe(false);
  });

  it("false si no se pueden leer los permisos", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarPermisosActuales = new DomainError("http_500", "error");
    const { result } = renderHook(() => usePuedeAdministrarConfig(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(port.listarPermisosActualesCalls).toHaveLength(1));
    expect(result.current).toBe(false);
  });
});
