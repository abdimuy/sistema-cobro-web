import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ZonasCajasScreen } from "./ZonasCajasScreen";
import { ConfiguracionProvider } from "../../presentation/context/ConfiguracionContext";
import {
  FakeConfiguracionPort,
  makeFakeOpcionesZonasCajas,
  makeFakeZonaCajaAsignacion,
} from "../../application/__tests__/fakeConfiguracionPort";

function renderScreen(port: FakeConfiguracionPort) {
  return render(
    <ConfiguracionProvider port={port}>
      <ZonasCajasScreen />
    </ConfiguracionProvider>,
  );
}

async function openPanel(user: ReturnType<typeof userEvent.setup>, zonaNombre: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(`Editar configuración de zona ${zonaNombre}`) }));
}

describe("ZonasCajasScreen", () => {
  it("renders one fixed-height row per zona with a summarized asignación line + meter", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);

    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    expect(
      screen.getByText(
        "CAJA1 · PATRICIA ELIZONDO VARGAS · OSCAR IVÁN DOMÍNGUEZ REYES · RUBÉN ALEJANDRO CASTILLO PEÑA",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "4 de 4 asignados" })).toBeInTheDocument();
  });

  it("clicking a row opens the panel with 4 catalog selects", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    await openPanel(user, "ZONA CENTRO — MORELIA");

    expect(await screen.findByText("Caja")).toBeInTheDocument();
    expect(screen.getByText("Cajero")).toBeInTheDocument();
    expect(screen.getByText("Vendedor")).toBeInTheDocument();
    expect(screen.getByText("Cobrador")).toBeInTheDocument();
  });

  it("cambiar caja + Guardar abre el diálogo de confirmación; confirmar llama a asignar con los ids elegidos y cierra el panel", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    await openPanel(user, "ZONA CENTRO — MORELIA");

    await user.click(screen.getByText("CAJA1"));
    await user.click(await screen.findByText("CAJA2"));

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Guardar configuración de zona")).toBeInTheDocument();

    // The mutation must not fire before confirming.
    expect(port.asignarZonaCajaCalls).toHaveLength(0);

    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarZonaCajaCalls).toHaveLength(1));
    expect(port.asignarZonaCajaCalls[0].input).toEqual({
      zonaClienteId: 12,
      cajaId: 502,
      cajeroId: 601,
      vendedorId: 701,
      cobradorId: 801,
    });

    await waitFor(() => expect(screen.queryByText("Caja")).not.toBeInTheDocument());
  });

  it("Guardar está deshabilitado sin cambios", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    await openPanel(user, "ZONA CENTRO — MORELIA");

    expect(await screen.findByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("elegir 'Sin asignar' en un slot envía el sentinel -1", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    await openPanel(user, "ZONA CENTRO — MORELIA");

    await user.click(screen.getByText("PATRICIA ELIZONDO VARGAS"));
    const options = await screen.findAllByText("Sin asignar");
    await user.click(options[options.length - 1]);

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarZonaCajaCalls).toHaveLength(1));
    expect(port.asignarZonaCajaCalls[0].input).toMatchObject({
      zonaClienteId: 12,
      cajeroId: -1,
    });
  });

  it("Cancelar revierte los cambios locales sin llamar a asignar", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    await openPanel(user, "ZONA CENTRO — MORELIA");

    await user.click(screen.getByText("CAJA1"));
    await user.click(await screen.findByText("CAJA2"));
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Caja")).not.toBeInTheDocument());

    expect(port.asignarZonaCajaCalls).toHaveLength(0);
    expect(screen.getByText(/CAJA1/)).toBeInTheDocument();
  });

  it("resincroniza el estado local tras un refresh externo (no reenvía ids obsoletos)", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();

    const before = makeFakeZonaCajaAsignacion({
      zonaClienteId: 12,
      zonaNombre: "ZONA CENTRO — MORELIA",
      caja: { id: 501, nombre: "CAJA1" },
    });
    const after = makeFakeZonaCajaAsignacion({
      zonaClienteId: 12,
      zonaNombre: "ZONA CENTRO — MORELIA",
      caja: { id: 502, nombre: "CAJA2" },
    });

    let listCalls = 0;
    port.listarZonasCajasResponse = () => {
      listCalls += 1;
      return listCalls === 1 ? [before] : [after];
    };
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();
    port.asignarZonaCajaResponse = after;

    renderScreen(port);
    await waitFor(() => expect(screen.getByText(/CAJA1/)).toBeInTheDocument());

    await openPanel(user, "ZONA CENTRO — MORELIA");
    await user.click(screen.getByText("CAJA1"));
    await user.click(await screen.findByText("CAJA2"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarZonaCajaCalls).toHaveLength(1));
    await waitFor(() => expect(screen.getByText(/CAJA2/)).toBeInTheDocument());

    // Reopen after the refresh landed: must show CAJA2 (fresh), not the
    // pre-save CAJA1, and Guardar must be disabled since nothing changed.
    await openPanel(user, "ZONA CENTRO — MORELIA");
    expect(await screen.findByText("CAJA2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("marca visualmente una zona totalmente sin asignar", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({
        zonaClienteId: 20,
        zonaNombre: "ZONA SIN CONFIGURAR",
        caja: null,
        cajero: null,
        vendedor: null,
        cobrador: null,
      }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);

    await waitFor(() => expect(screen.getByText("ZONA SIN CONFIGURAR")).toBeInTheDocument());
    expect(screen.getByRole("img", { name: "0 de 4 asignados" })).toBeInTheDocument();
    const matches = screen.getAllByText("Sin asignar");
    expect(matches.find((el) => el.tagName === "SPAN")).toBeInTheDocument();
  });

  it("filtra por búsqueda (acento-insensible) sobre zona y nombres asignados", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
      makeFakeZonaCajaAsignacion({
        zonaClienteId: 13,
        zonaNombre: "ZONA URUAPAN",
        caja: { id: 501, nombre: "CAJA1" },
        cajero: { id: 602, nombre: "NORMA ANGÉLICA JIMÉNEZ SOTO" },
        vendedor: { id: 702, nombre: "LUIS FERNANDO AGUILAR MORA" },
        cobrador: { id: 802, nombre: "GABRIELA MONTSERRAT LEÓN RAMOS" },
      }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "moreLIA");

    expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument();
    expect(screen.queryByText("ZONA URUAPAN")).not.toBeInTheDocument();
  });

  it("filtra por estado con conteos correctos", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({
        zonaClienteId: 20,
        zonaNombre: "ZONA SIN CONFIGURAR",
        caja: null,
        cajero: null,
        vendedor: null,
        cobrador: null,
      }),
      makeFakeZonaCajaAsignacion({
        zonaClienteId: 21,
        zonaNombre: "ZONA PARCIAL",
        caja: { id: 501, nombre: "CAJA1" },
        cajero: null,
        vendedor: null,
        cobrador: null,
      }),
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA SIN CONFIGURAR")).toBeInTheDocument());

    expect(screen.getByRole("button", { name: /Todas/ })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /^Sin asignar/ })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Incompletas/ })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Completas/ })).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: /Completas/ }));

    expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument();
    expect(screen.queryByText("ZONA SIN CONFIGURAR")).not.toBeInTheDocument();
    expect(screen.queryByText("ZONA PARCIAL")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no zonas", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("Sin zonas")).toBeInTheDocument());
  });

  it("shows a 'sin resultados' state when the filter/search yields nothing", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "no-existe-zona");

    expect(await screen.findByText("Sin resultados")).toBeInTheDocument();
  });

  it("surfaces a load error", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarZonasCajas = new Error("network_error");
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
