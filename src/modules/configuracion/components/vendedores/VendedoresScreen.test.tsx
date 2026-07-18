import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

  it("picking a partial identity on an already-partial estado also reveals the override panel on load", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({
        usuarioId: "uid-jorge",
        nombre: "JORGE LUIS MENDOZA CASTRO",
        estado: "2/3",
        mapping: {
          v1: { listaId: 401, nombre: "JORGE MENDOZA V1" },
          v2: { listaId: 402, nombre: "JORGE MENDOZA V2" },
          v3: null,
        },
      }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("JORGE LUIS MENDOZA CASTRO")).toBeInTheDocument());

    // No identity was picked in this session — the panel must appear purely
    // because the on-load estado is already partial (2/3), so the admin can
    // complete the missing slot without re-picking the whole identity.
    expect(screen.getByText("Completar slots faltantes")).toBeInTheDocument();
  });

  it("clears local slots after Quitar so Guardar cannot resurrect the removed mapping", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();

    const withMapping = makeFakeVendedorAsignacion({
      usuarioId: "uid-maria",
      nombre: "MARIA FERNANDA TORRES OCHOA",
      estado: "3/3",
      mapping: {
        v1: { listaId: 301, nombre: "MARIA TORRES V1" },
        v2: { listaId: 302, nombre: "MARIA TORRES V2" },
        v3: { listaId: 303, nombre: "MARIA TORRES V3" },
      },
    });
    const cleared = makeFakeVendedorAsignacion({
      usuarioId: "uid-maria",
      nombre: "MARIA FERNANDA TORRES OCHOA",
      estado: "sin asignar",
      mapping: { v1: null, v2: null, v3: null },
    });

    let listCalls = 0;
    port.listarVendedoresResponse = () => {
      listCalls += 1;
      // First load returns the existing 3/3 mapping; the refetch triggered
      // by eliminar()'s onSuccess (refresh()) returns it cleared, mirroring
      // what the real API returns right after a successful DELETE.
      return listCalls === 1 ? [withMapping] : [cleared];
    };
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("MARIA FERNANDA TORRES OCHOA")).toBeInTheDocument());
    expect(screen.getByText("✓ 3/3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(port.eliminarVendedorCalls).toHaveLength(1));
    await waitFor(() => expect(screen.getByText("Sin asignar")).toBeInTheDocument());

    // Regression: without resyncing local state to the cleared prop, `slots`
    // would still hold {l1:301, l2:302, l3:303} here, and clicking Guardar
    // would silently re-PUT the mapping that Quitar just removed.
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarVendedorCalls).toHaveLength(1));
    expect(port.asignarVendedorCalls[0].input).toEqual({
      usuarioId: "uid-maria",
      listaId1: null,
      listaId2: null,
      listaId3: null,
    });
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
