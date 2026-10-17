import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ZonasExcluidasScreen } from "./ZonasExcluidasScreen";
import { ConfiguracionProvider } from "../../presentation/context/ConfiguracionContext";
import {
  FakeConfiguracionPort,
  makeFakeOpcionesZonasCajas,
  makeFakeZonaExcluidaDesempeno,
} from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

function armar(): FakeConfiguracionPort {
  const port = new FakeConfiguracionPort();
  port.listarZonasExcluidasDesempenoResponse = [makeFakeZonaExcluidaDesempeno()];
  port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas({
    zonas: [
      { id: 23301, nombre: "MAYOREO" },
      { id: 12, nombre: "ZONA CENTRO — MORELIA" },
    ],
  });
  return port;
}

function renderScreen(port: FakeConfiguracionPort) {
  return render(
    <ConfiguracionProvider port={port}>
      <ZonasExcluidasScreen />
    </ConfiguracionProvider>,
  );
}

describe("ZonasExcluidasScreen", () => {
  it("lista MAYOREO con su fecha de exclusión", async () => {
    renderScreen(armar());

    expect(await screen.findByText("MAYOREO")).toBeInTheDocument();
    expect(screen.getByText("Zonas fuera de desempeño")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("Excluir zona ofrece sólo zonas no excluidas y llama excluir(id); la lista se refresca tras la respuesta", async () => {
    const user = userEvent.setup();
    const port = armar();
    let lista = [makeFakeZonaExcluidaDesempeno()];
    port.listarZonasExcluidasDesempenoResponse = () => lista;
    let soltar!: () => void;
    port.excluirZonaDesempenoResponse = () =>
      new Promise((res) => {
        soltar = () => {
          lista = [
            ...lista,
            makeFakeZonaExcluidaDesempeno({ zonaId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
          ];
          res(lista[1]);
        };
      });
    renderScreen(port);
    await screen.findByText("MAYOREO");

    await user.click(await screen.findByRole("button", { name: "Excluir zona" }));
    // MAYOREO ya está excluida: no se ofrece en el combobox.
    const lista0 = await screen.findByRole("listbox");
    expect(within(lista0).queryByText("MAYOREO")).not.toBeInTheDocument();
    await user.click(within(lista0).getByText("ZONA CENTRO — MORELIA"));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(port.excluirZonaDesempenoCalls).toEqual([expect.objectContaining({ zonaId: 12 })]));
    // Antes de la respuesta: la fila nueva NO aparece.
    const tabla = () => within(screen.getByRole("table", { hidden: true }));
    expect(tabla().queryByText("ZONA CENTRO — MORELIA")).not.toBeInTheDocument();
    expect(port.listarZonasExcluidasDesempenoCalls).toHaveLength(1);

    soltar();
    await waitFor(() => expect(tabla().getByText("ZONA CENTRO — MORELIA")).toBeInTheDocument());
    expect(port.listarZonasExcluidasDesempenoCalls).toHaveLength(2);
  });

  it("Quitar pide confirmación y llama quitar(23301)", async () => {
    const user = userEvent.setup();
    const port = armar();
    renderScreen(port);
    await screen.findByText("MAYOREO");

    await user.click(screen.getByRole("button", { name: "Quitar MAYOREO" }));
    expect(port.quitarZonaExcluidaDesempenoCalls).toHaveLength(0);

    const dialogo = await screen.findByRole("alertdialog");
    await user.click(within(dialogo).getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(port.quitarZonaExcluidaDesempenoCalls[0]?.zonaId).toBe(23301));
  });

  it("un error del servidor se muestra con su mensaje", async () => {
    const user = userEvent.setup();
    const port = armar();
    port.throwOnNext.excluirZonaDesempeno = new DomainError(
      "zona_no_existe",
      "la zona seleccionada ya no existe",
    );
    renderScreen(port);
    await screen.findByText("MAYOREO");

    await user.click(await screen.findByRole("button", { name: "Excluir zona" }));
    await user.click(within(await screen.findByRole("listbox")).getByText("ZONA CENTRO — MORELIA"));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("la zona seleccionada ya no existe");
  });

  it("doble clic en Excluir con la acción pendiente hace una sola llamada", async () => {
    const user = userEvent.setup();
    const port = armar();
    port.excluirZonaDesempenoResponse = () => new Promise(() => {});
    renderScreen(port);
    await screen.findByText("MAYOREO");

    await user.click(await screen.findByRole("button", { name: "Excluir zona" }));
    await user.click(within(await screen.findByRole("listbox")).getByText("ZONA CENTRO — MORELIA"));
    const boton = screen.getByRole("button", { name: "Excluir" });
    await user.click(boton);
    await user.click(boton);

    expect(port.excluirZonaDesempenoCalls).toHaveLength(1);
  });

  it("tras zona_no_existe se relee el catálogo y la zona sale del combobox", async () => {
    const user = userEvent.setup();
    const port = armar();
    let catalogo = makeFakeOpcionesZonasCajas({
      zonas: [
        { id: 23301, nombre: "MAYOREO" },
        { id: 12, nombre: "ZONA CENTRO — MORELIA" },
      ],
    });
    port.listarOpcionesZonasCajasResponse = () => catalogo;
    port.throwOnNext.excluirZonaDesempeno = new DomainError(
      "zona_no_existe",
      "la zona seleccionada ya no existe",
    );
    renderScreen(port);
    await screen.findByText("MAYOREO");

    await user.click(await screen.findByRole("button", { name: "Excluir zona" }));
    await user.click(within(await screen.findByRole("listbox")).getByText("ZONA CENTRO — MORELIA"));
    catalogo = makeFakeOpcionesZonasCajas({ zonas: [{ id: 23301, nombre: "MAYOREO" }] });
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(port.listarOpcionesZonasCajasCalls).toHaveLength(2));
    await waitFor(() =>
      expect(within(screen.getByRole("listbox")).queryByText("ZONA CENTRO — MORELIA")).not.toBeInTheDocument(),
    );
  });

  it("sin config:administrar no hay botones de agregar ni quitar", async () => {
    const port = armar();
    port.listarPermisosActualesResponse = ["config:leer"];
    renderScreen(port);

    await screen.findByText("MAYOREO");
    await waitFor(() => expect(port.listarPermisosActualesCalls).toHaveLength(1));

    expect(screen.queryByRole("button", { name: "Excluir zona" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Quitar/ })).not.toBeInTheDocument();
  });

  it("con config:administrar sí aparecen", async () => {
    renderScreen(armar());
    await screen.findByText("MAYOREO");
    expect(await screen.findByRole("button", { name: "Excluir zona" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar MAYOREO" })).toBeInTheDocument();
  });
});
