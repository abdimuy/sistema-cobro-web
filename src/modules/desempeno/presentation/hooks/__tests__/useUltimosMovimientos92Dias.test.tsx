import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useUltimosMovimientos92Dias } from "../useUltimosMovimientos92Dias";
import { DesempenoProvider } from "../../context/DesempenoProvider";
import { FakeDesempenoPort } from "../../../application/__tests__/fakeDesempenoPort";

function envolver(port: FakeDesempenoPort) {
  return ({ children }: { children: ReactNode }) => <DesempenoProvider port={port}>{children}</DesempenoProvider>;
}

// Contrato pulido 2 §4: una llamada al abrir "Ver N"; nada mientras está cerrado.
describe("useUltimosMovimientos92Dias", () => {
  it("con null no pide nada", () => {
    const port = new FakeDesempenoPort();
    renderHook(() => useUltimosMovimientos92Dias(null), { wrapper: envolver(port) });
    expect(port.ultimosMovimientosCalls).toEqual([]);
  });

  it("los mismos uids en otro arreglo (refresco del tablero) no vuelven a pedir", async () => {
    const port = new FakeDesempenoPort();
    port.ultimosMovimientosResponse = { generadoAt: "2026-10-14T22:40:00Z", porUid: new Map([["u2", null]]) };
    const { result, rerender } = renderHook(({ uids }) => useUltimosMovimientos92Dias(uids), {
      wrapper: envolver(port),
      initialProps: { uids: ["u2", "u3"] as readonly string[] | null },
    });
    await waitFor(() => expect(result.current.movimientoDe("u2")).toEqual({ estado: "listo", movimiento: null }));
    rerender({ uids: ["u2", "u3"] });
    expect(result.current.movimientoDe("u3")).toEqual({ estado: "sin_dato" });
    expect(port.ultimosMovimientosCalls).toHaveLength(1);
  });
});
