import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

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

async function openPanel(user: ReturnType<typeof userEvent.setup>, nombre: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(`Editar mapeo de vendedor de ${nombre}`, "i") }));
}

describe("VendedoresScreen", () => {
  it("renders one fixed-height row per usuario with resolved nombre + meter", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({
        usuarioId: "uid-1",
        nombre: "BRENDA SÁNCHEZ RUIZ",
        estado: "2/3",
        mapping: {
          v1: { listaId: 101, nombre: "BRENDA SANCHEZ RUIZ MICROSIP" },
          v2: { listaId: 102, nombre: "BRENDA SANCHEZ RUIZ MICROSIP" },
          v3: null,
        },
      }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);

    await waitFor(() => expect(screen.getByText("BRENDA SÁNCHEZ RUIZ")).toBeInTheDocument());
    expect(screen.getByText("brenda.sanchez@muebleriamsp.mx")).toBeInTheDocument();
    expect(screen.getByText("BRENDA SANCHEZ RUIZ MICROSIP")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2 de 3 asignados" })).toBeInTheDocument();
  });

  it("shows 'Sin asignar' when the vendedor has no mapping", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "CARLOS RAMOS LUNA", estado: "sin asignar" }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);

    await waitFor(() => expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument());
    const matches = screen.getAllByText("Sin asignar");
    expect(matches.find((el) => el.tagName === "SPAN")).toBeInTheDocument();
  });

  it("clicking a row opens the side panel with the usuario's header", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "CARLOS RAMOS LUNA", estado: "sin asignar" }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument());

    await openPanel(user, "CARLOS RAMOS LUNA");

    expect(await screen.findByText("Vendedor 1")).toBeInTheDocument();
    expect(screen.getByText("Vendedor 2")).toBeInTheDocument();
    expect(screen.getByText("Vendedor 3")).toBeInTheDocument();
  });

  it("picking a complete (3/3) identity auto-fills the 3 slots; Guardar sends the resolved ids and closes the panel", async () => {
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
    port.asignarVendedorResponse = makeFakeVendedorAsignacion({ usuarioId: "uid-1", estado: "3/3" });

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("BRENDA SÁNCHEZ RUIZ")).toBeInTheDocument());
    await openPanel(user, "BRENDA SÁNCHEZ RUIZ");

    await user.click(screen.getByText("Buscar vendedor…"));
    await user.click(await screen.findByText("BRENDA SANCHEZ RUIZ MICROSIP"));

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarVendedorCalls).toHaveLength(1));
    expect(port.asignarVendedorCalls[0].input).toEqual({
      usuarioId: "uid-1",
      listaId1: 101,
      listaId2: 102,
      listaId3: 103,
    });

    // The panel closes after a successful Guardar.
    await waitFor(() => expect(screen.queryByText("Vendedor 1")).not.toBeInTheDocument());
  });

  it("overriding a single slot changes only that slot's id", async () => {
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
      makeFakeIdentidadMicrosip({
        nombre: "IDENTIDAD SOLO V3",
        v1ListaId: null,
        v2ListaId: null,
        v3ListaId: 303,
        matchCount: 1,
      }),
    ];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument());
    await openPanel(user, "CARLOS RAMOS LUNA");

    await user.click(screen.getByText("Buscar vendedor…"));
    await user.click(await screen.findByText("CARLOS RAMOS LUNA MICROSIP"));

    await user.click(screen.getByText("Buscar vendedor 3…"));
    await user.click(await screen.findByText("IDENTIDAD SOLO V3"));

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarVendedorCalls).toHaveLength(1));
    expect(port.asignarVendedorCalls[0].input).toEqual({
      usuarioId: "uid-1",
      listaId1: 201,
      listaId2: 202,
      listaId3: 303,
    });
  });

  it("Guardar is disabled without changes and enabled after a change", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({
        usuarioId: "uid-1",
        nombre: "MARIA FERNANDA TORRES OCHOA",
        estado: "3/3",
        mapping: {
          v1: { listaId: 301, nombre: "MARIA TORRES V1" },
          v2: { listaId: 302, nombre: "MARIA TORRES V2" },
          v3: { listaId: 303, nombre: "MARIA TORRES V3" },
        },
      }),
    ];
    port.listarOpcionesResponse = [
      makeFakeIdentidadMicrosip({
        nombre: "OTRA IDENTIDAD",
        v1ListaId: 401,
        v2ListaId: 402,
        v3ListaId: 403,
        matchCount: 3,
      }),
    ];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("MARIA FERNANDA TORRES OCHOA")).toBeInTheDocument());
    await openPanel(user, "MARIA FERNANDA TORRES OCHOA");

    expect(await screen.findByRole("button", { name: "Guardar" })).toBeDisabled();

    await user.click(screen.getByText("Buscar vendedor…"));
    await user.click(await screen.findByText("OTRA IDENTIDAD"));

    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  it("Cancelar discards local changes without calling asignar", async () => {
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
        v3ListaId: 203,
        matchCount: 3,
      }),
    ];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument());
    await openPanel(user, "CARLOS RAMOS LUNA");

    await user.click(screen.getByText("Buscar vendedor…"));
    await user.click(await screen.findByText("CARLOS RAMOS LUNA MICROSIP"));

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Vendedor 1")).not.toBeInTheDocument());

    expect(port.asignarVendedorCalls).toHaveLength(0);
    // Row still shows "Sin asignar" — the pick never persisted.
    const matches = screen.getAllByText("Sin asignar");
    expect(matches.find((el) => el.tagName === "SPAN")).toBeInTheDocument();
  });

  it("Quitar (behind confirm) calls eliminar and closes the panel", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({
        usuarioId: "uid-maria",
        nombre: "MARIA FERNANDA TORRES OCHOA",
        estado: "3/3",
        mapping: {
          v1: { listaId: 301, nombre: "MARIA TORRES V1" },
          v2: { listaId: 302, nombre: "MARIA TORRES V2" },
          v3: { listaId: 303, nombre: "MARIA TORRES V3" },
        },
      }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("MARIA FERNANDA TORRES OCHOA")).toBeInTheDocument());
    await openPanel(user, "MARIA FERNANDA TORRES OCHOA");

    await user.click(screen.getByRole("button", { name: "Quitar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(port.eliminarVendedorCalls).toHaveLength(1));
    expect(port.eliminarVendedorCalls[0].usuarioId).toBe("uid-maria");
    await waitFor(() => expect(screen.queryByText("Vendedor 1")).not.toBeInTheDocument());
  });

  it("Quitar que falla: el panel cierra (optimista) pero la fila conserva el mapeo real y se notifica el error", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({
        usuarioId: "uid-maria",
        nombre: "MARIA FERNANDA TORRES OCHOA",
        estado: "3/3",
        mapping: {
          v1: { listaId: 301, nombre: "MARIA TORRES V1" },
          v2: { listaId: 302, nombre: "MARIA TORRES V2" },
          v3: { listaId: 303, nombre: "MARIA TORRES V3" },
        },
      }),
    ];
    port.listarOpcionesResponse = [];
    port.throwOnNext.eliminarVendedor = new Error("network_error");

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("MARIA FERNANDA TORRES OCHOA")).toBeInTheDocument());
    await openPanel(user, "MARIA FERNANDA TORRES OCHOA");

    await user.click(screen.getByRole("button", { name: "Quitar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));

    // Optimistic close: the panel closes immediately even though eliminar
    // ultimately fails (this is the reviewer-accepted trade-off).
    await waitFor(() => expect(screen.queryByText("Vendedor 1")).not.toBeInTheDocument());
    await waitFor(() => expect(port.eliminarVendedorCalls).toHaveLength(1));

    // No refresh ran (the port call threw before onSuccess), so the row must
    // keep showing the TRUE, un-deleted mapping — never a stale cleared row.
    expect(screen.getByRole("img", { name: "3 de 3 asignados" })).toBeInTheDocument();
    expect(screen.queryAllByText("Sin asignar").find((el) => el.tagName === "SPAN")).toBeUndefined();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo eliminar la asignación",
        expect.objectContaining({ description: "network_error" }),
      ),
    );
  });

  it("anti-resurrección: reopening after Quitar+refresh shows the cleared mapping and Guardar stays disabled", async () => {
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
      return listCalls === 1 ? [withMapping] : [cleared];
    };
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("MARIA FERNANDA TORRES OCHOA")).toBeInTheDocument());
    await openPanel(user, "MARIA FERNANDA TORRES OCHOA");

    await user.click(screen.getByRole("button", { name: "Quitar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(port.eliminarVendedorCalls).toHaveLength(1));
    await waitFor(() => {
      const matches = screen.getAllByText("Sin asignar");
      expect(matches.find((el) => el.tagName === "SPAN")).toBeInTheDocument();
    });

    // Reopen: must reflect the cleared mapping, not the pre-Quitar slots.
    await openPanel(user, "MARIA FERNANDA TORRES OCHOA");
    expect(await screen.findByRole("button", { name: "Guardar" })).toBeDisabled();

    // Regression: clicking Guardar here (if it were enabled) would resurrect
    // the removed ids. It must stay disabled, so no asignar call is possible.
    expect(port.asignarVendedorCalls).toHaveLength(0);
  });

  it("filtra por búsqueda (acento-insensible) sobre nombre, email y vendedor resuelto", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "BRENDA SÁNCHEZ RUIZ", estado: "sin asignar" }),
      makeFakeVendedorAsignacion({
        usuarioId: "uid-2",
        nombre: "JORGE LUIS MENDOZA CASTRO",
        email: "jorge.mendoza@muebleriamsp.mx",
        estado: "sin asignar",
      }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("BRENDA SÁNCHEZ RUIZ")).toBeInTheDocument());

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "sanchez");

    expect(screen.getByText("BRENDA SÁNCHEZ RUIZ")).toBeInTheDocument();
    expect(screen.queryByText("JORGE LUIS MENDOZA CASTRO")).not.toBeInTheDocument();
  });

  it("filtra por estado con conteos correctos", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "SIN ASIGNAR UNO", estado: "sin asignar" }),
      makeFakeVendedorAsignacion({
        usuarioId: "uid-2",
        nombre: "INCOMPLETO DOS",
        estado: "2/3",
        mapping: {
          v1: { listaId: 1, nombre: "X" },
          v2: { listaId: 2, nombre: "Y" },
          v3: null,
        },
      }),
      makeFakeVendedorAsignacion({
        usuarioId: "uid-3",
        nombre: "COMPLETO TRES",
        estado: "3/3",
        mapping: {
          v1: { listaId: 1, nombre: "X" },
          v2: { listaId: 2, nombre: "Y" },
          v3: { listaId: 3, nombre: "Z" },
        },
      }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("SIN ASIGNAR UNO")).toBeInTheDocument());

    expect(screen.getByRole("button", { name: /Todos/ })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /^Sin asignar/ })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Incompletos/ })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Completos/ })).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: /Completos/ }));

    expect(screen.getByText("COMPLETO TRES")).toBeInTheDocument();
    expect(screen.queryByText("SIN ASIGNAR UNO")).not.toBeInTheDocument();
    expect(screen.queryByText("INCOMPLETO DOS")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no usuarios", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("Sin usuarios")).toBeInTheDocument());
  });

  it("shows a 'sin resultados' state when the filter/search yields nothing", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "CARLOS RAMOS LUNA", estado: "sin asignar" }),
    ];
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument());

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "no-existe-nadie");

    expect(await screen.findByText("Sin resultados")).toBeInTheDocument();
  });

  it("surfaces a load error", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarVendedores = new Error("network_error");
    port.listarOpcionesResponse = [];

    renderScreen(port);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
