import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { VendedoresScreen } from "./VendedoresScreen";
import { ConfiguracionProvider } from "../../presentation/context/ConfiguracionContext";
import {
  FakeConfiguracionPort,
  makeFakeIdentidadMicrosip,
  makeFakeVendedorAsignacion,
} from "../../application/__tests__/fakeConfiguracionPort";

function renderScreen(port: FakeConfiguracionPort) {
  return render(
    <ConfiguracionProvider port={port}>
      <VendedoresScreen />
    </ConfiguracionProvider>,
  );
}

describe("VendedoresScreen", () => {
  it("renders one row per usuario with nombre, email y estado", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "BRENDA SÁNCHEZ RUIZ", estado: "sin asignar" }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);

    await waitFor(() => expect(screen.getByText("BRENDA SÁNCHEZ RUIZ")).toBeInTheDocument());
    expect(screen.getByText("brenda.sanchez@muebleriamsp.mx")).toBeInTheDocument();
    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
  });

  it("picking a complete (3/3) identity auto-fills the 3 slots and Guardar sends the resolved ids", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "BRENDA SÁNCHEZ RUIZ", estado: "sin asignar" }),
    ];
    port.listarOpcionesResponse = [
      makeFakeIdentidadMicrosip({
        nombre: "BRENDA SANCHEZ RUIZ MICROSIP",
        v1ListaId: 101,
        v2ListaId: 102,
        v3ListaId: 103,
        matchCount: 3,
      }),
    ];
    port.asignarVendedorResponse = makeFakeVendedorAsignacion({
      usuarioId: "uid-1",
      estado: "3/3",
    });

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("BRENDA SÁNCHEZ RUIZ")).toBeInTheDocument());

    await user.click(screen.getByText("Buscar vendedor…"));
    await user.click(await screen.findByText("BRENDA SANCHEZ RUIZ MICROSIP"));

    // A complete identity must not reveal the manual override panel.
    expect(screen.queryByText("Completar slots faltantes")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarVendedorCalls).toHaveLength(1));
    expect(port.asignarVendedorCalls[0].input).toEqual({
      usuarioId: "uid-1",
      listaId1: 101,
      listaId2: 102,
      listaId3: 103,
    });
  });

  it("picking an incomplete (2/3) identity shows the warning override panel", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "CARLOS RAMOS LUNA", estado: "sin asignar" }),
    ];
    port.listarOpcionesResponse = [
      makeFakeIdentidadMicrosip({
        nombre: "CARLOS RAMOS LUNA MICROSIP",
        v1ListaId: 201,
        v2ListaId: 202,
        v3ListaId: null,
        matchCount: 2,
      }),
    ];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument());

    await user.click(screen.getByText("Buscar vendedor…"));
    await user.click(await screen.findByText("CARLOS RAMOS LUNA MICROSIP"));

    expect(await screen.findByText("Completar slots faltantes")).toBeInTheDocument();
  });

  it("shows the empty state when there are no usuarios", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("Sin usuarios")).toBeInTheDocument());
  });

  it("surfaces a load error", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarVendedores = new Error("network_error");
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
