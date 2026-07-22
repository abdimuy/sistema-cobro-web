import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { BandejaProvider } from "../context/BandejaContext";
import { useAccionesBorrador } from "./useAccionesBorrador";
import { FakeBandejaPort } from "../../application/__tests__/fakeBandejaPort";
import { DomainError } from "../../domain/errors";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapWith(port: FakeBandejaPort) {
  return ({ children }: { children: ReactNode }) => (
    <BandejaProvider port={port}>{children}</BandejaProvider>
  );
}

describe("useAccionesBorrador", () => {
  it("aprobar: idle -> enviando -> hecho, y dispara onDone", async () => {
    const port = new FakeBandejaPort();
    let resolveAprobar!: () => void;
    port.aprobar = (clienteId: number) => {
      port.aprobarCalls.push({ clienteId });
      return new Promise<void>((resolve) => {
        resolveAprobar = resolve;
      });
    };

    const onDone = vi.fn();
    const { result } = renderHook(() => useAccionesBorrador(1001, onDone), {
      wrapper: wrapWith(port),
    });

    expect(result.current.estado).toBe("idle");

    let aprobarPromise!: Promise<void>;
    act(() => {
      aprobarPromise = result.current.aprobar();
    });
    expect(result.current.estado).toBe("enviando");

    await act(async () => {
      resolveAprobar();
      await aprobarPromise;
    });

    expect(result.current.estado).toBe("hecho");
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(port.aprobarCalls).toHaveLength(1);
  });

  it("rejected port call sets 'error' y no llama onDone", async () => {
    const port = new FakeBandejaPort();
    port.throwOnNext.aprobar = new DomainError("envio_fallido", "no se pudo enviar");
    const onDone = vi.fn();
    const { result } = renderHook(() => useAccionesBorrador(1001, onDone), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.aprobar();
    });

    expect(result.current.estado).toBe("error");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("ignora una segunda llamada mientras está 'enviando'", async () => {
    const port = new FakeBandejaPort();
    let resolveAprobar!: () => void;
    port.aprobar = (clienteId: number) => {
      port.aprobarCalls.push({ clienteId });
      return new Promise<void>((resolve) => {
        resolveAprobar = resolve;
      });
    };

    const { result } = renderHook(() => useAccionesBorrador(1001, vi.fn()), {
      wrapper: wrapWith(port),
    });

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.aprobar();
      second = result.current.aprobar();
    });
    expect(result.current.estado).toBe("enviando");

    await act(async () => {
      resolveAprobar();
      await Promise.all([first, second]);
    });

    expect(port.aprobarCalls).toHaveLength(1);
    await waitFor(() => expect(result.current.estado).toBe("hecho"));
  });

  it("dictar devuelve el borrador y llega a 'hecho'", async () => {
    const port = new FakeBandejaPort();
    port.dictarResponse = { borrador: "nuevo borrador dictado" };
    const { result } = renderHook(() => useAccionesBorrador(1001, vi.fn()), {
      wrapper: wrapWith(port),
    });

    let response: { borrador: string } | null = null;
    await act(async () => {
      response = await result.current.dictar("ofrecer_comedor");
    });

    expect(response).toEqual({ borrador: "nuevo borrador dictado" });
    expect(result.current.estado).toBe("hecho");
    expect(port.dictarCalls[0]).toEqual({ clienteId: 1001, intencion: "ofrecer_comedor" });
  });
});
