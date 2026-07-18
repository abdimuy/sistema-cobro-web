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

describe("ZonasCajasScreen", () => {
  it("renders one row per zona with su nombre y selects poblados", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);

    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    expect(screen.getByText("CAJA1")).toBeInTheDocument();
    expect(screen.getByText("PATRICIA ELIZONDO VARGAS")).toBeInTheDocument();
  });

  it("cambiar caja + Guardar abre el diálogo de confirmación; confirmar llama a asignar con los ids elegidos", async () => {
    const user = userEvent.setup();
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
    ];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());

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

  it("resincroniza el estado local cuando la zona cambia tras un refresh (no reenvía ids obsoletos)", async () => {
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
    await waitFor(() => expect(screen.getByText("CAJA1")).toBeInTheDocument());

    // Guardar sin cambiar nada: dispara la mutación → refresh() → la lista
    // vuelve con CAJA2 para esta zona (cambio externo simulando otro admin).
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarZonaCajaCalls).toHaveLength(1));
    await waitFor(() => expect(screen.getByText("CAJA2")).toBeInTheDocument());

    // Regression: without resyncing local state to the refreshed prop, the
    // row would still show the stale CAJA1 id and Guardar would re-submit it.
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    const dialog2 = await screen.findByRole("alertdialog");
    await user.click(within(dialog2).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(port.asignarZonaCajaCalls).toHaveLength(2));
    expect(port.asignarZonaCajaCalls[1].input).toMatchObject({ cajaId: 502 });
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
    // "Sin asignar" also appears as each combobox trigger's own text (they
    // default to the sentinel too) — the badge is the one rendered as a div,
    // not the span inside a combobox trigger button.
    const matches = screen.getAllByText("Sin asignar");
    const badge = matches.find((el) => el.tagName === "DIV");
    expect(badge).toBeInTheDocument();
  });

  it("shows the empty state when there are no zonas", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [];
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByText("Sin zonas")).toBeInTheDocument());
  });

  it("surfaces a load error", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarZonasCajas = new Error("network_error");
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();

    renderScreen(port);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
