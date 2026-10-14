import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

// El cliente HTTP real arrastra Firebase: se sustituye por un marcador.
vi.mock("../infrastructure/http/apiClient", () => ({ apiClient: { marcador: "apiClient-desempeno" } }));

const adaptador = vi.hoisted(() => ({ clientes: [] as unknown[] }));
vi.mock("../infrastructure/http/HttpDesempenoAdapter", async () => {
  const { FakeDesempenoPort } = await import("../application/__tests__/fakeDesempenoPort");
  class HttpDesempenoAdapter extends FakeDesempenoPort {
    constructor(client: unknown) {
      super();
      adaptador.clientes.push(client);
    }
  }
  return { HttpDesempenoAdapter };
});

vi.mock("@/modules/clientes", () => ({
  ClientesContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="clientes-container">{children}</div>
  ),
  PagoModal: () => null,
  VentaModal: () => null,
  ClienteFicha: () => null,
}));

import { Desempeno } from "../index";

describe("Desempeno (raíz de composición)", () => {
  it("usa HttpDesempenoAdapter(apiClient) y envuelve la pantalla con ClientesContainer", async () => {
    render(
      <MemoryRouter>
        <Desempeno puedeConfigurar={false} />
      </MemoryRouter>,
    );
    const tablero = await screen.findByRole("heading", { name: "Desempeño de cobradores" });
    expect(screen.getByTestId("clientes-container")).toContainElement(tablero);
    expect(adaptador.clientes).toEqual([{ marcador: "apiClient-desempeno" }]);
  });
});
