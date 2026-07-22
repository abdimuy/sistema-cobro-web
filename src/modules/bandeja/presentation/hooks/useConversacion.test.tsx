import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { BandejaProvider } from "../context/BandejaContext";
import { useConversacion } from "./useConversacion";
import { FakeBandejaPort, makeFakeConversacionDetalle } from "../../application/__tests__/fakeBandejaPort";

function wrapWith(port: FakeBandejaPort) {
  return ({ children }: { children: ReactNode }) => (
    <BandejaProvider port={port}>{children}</BandejaProvider>
  );
}

describe("useConversacion", () => {
  it("stays null and does not fetch when clienteId is null", () => {
    const port = new FakeBandejaPort();
    const { result } = renderHook(() => useConversacion(null), { wrapper: wrapWith(port) });

    expect(result.current.detalle).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(port.obtenerConversacionCalls).toHaveLength(0);
  });

  it("fetches when clienteId changes", async () => {
    const port = new FakeBandejaPort();
    port.obtenerConversacionResponse = makeFakeConversacionDetalle({
      conversacion: { ...makeFakeConversacionDetalle().conversacion, clienteId: 2002 },
    });
    const { result, rerender } = renderHook(({ clienteId }) => useConversacion(clienteId), {
      wrapper: wrapWith(port),
      initialProps: { clienteId: null as number | null },
    });

    expect(port.obtenerConversacionCalls).toHaveLength(0);

    rerender({ clienteId: 2002 });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(port.obtenerConversacionCalls).toHaveLength(1);
    expect(port.obtenerConversacionCalls[0].clienteId).toBe(2002);
    expect(result.current.detalle?.conversacion.clienteId).toBe(2002);

    rerender({ clienteId: 3003 });
    await waitFor(() => expect(port.obtenerConversacionCalls).toHaveLength(2));
    expect(port.obtenerConversacionCalls[1].clienteId).toBe(3003);
  });
});
