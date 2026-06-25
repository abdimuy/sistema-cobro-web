import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

import { RutasScreen } from "./RutasScreen";
import { RutasProvider } from "../presentation/context/RutasContext";
import {
  FakeRutasPort,
  makeFakeReporteUsuario,
  makeFakeVentaCobranza,
} from "../application/__tests__/fakeRutasPort";

function LocationSpy() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function renderScreen(port: FakeRutasPort) {
  return render(
    <MemoryRouter initialEntries={["/rutas"]}>
      <RutasProvider port={port}>
        <Routes>
          <Route path="/rutas" element={<RutasScreen />} />
          <Route
            path="/clientes/:id"
            element={<div data-testid="ficha">ficha cliente</div>}
          />
        </Routes>
        <LocationSpy />
      </RutasProvider>
    </MemoryRouter>,
  );
}

describe("RutasScreen (per-user report)", () => {
  it("renders one row per usuario from the port", async () => {
    const port = new FakeRutasPort();
    port.reporteUsuariosResponse = [
      makeFakeReporteUsuario({ uid: "uid-1", nombre: "JUAN PÉREZ TORRES" }),
      makeFakeReporteUsuario({ uid: "uid-2", nombre: "CARLOS RAMOS LUNA" }),
    ];

    renderScreen(port);

    await waitFor(() =>
      expect(screen.getByText("JUAN PÉREZ TORRES")).toBeInTheDocument(),
    );
    expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument();
    expect(screen.getByText("2 usuarios")).toBeInTheDocument();
  });

  it("muestra el email del usuario bajo el nombre", async () => {
    const port = new FakeRutasPort();
    port.reporteUsuariosResponse = [
      makeFakeReporteUsuario({
        nombre: "JUAN PÉREZ",
        email: "juan.perez@muebleriamsp.mx",
      }),
    ];
    renderScreen(port);
    await waitFor(() =>
      expect(
        screen.getByText("juan.perez@muebleriamsp.mx"),
      ).toBeInTheDocument(),
    );
  });

  it("clicking a row opens the desglose and clicking a cliente navigates", async () => {
    const user = userEvent.setup();
    const port = new FakeRutasPort();
    port.reporteUsuariosResponse = [
      makeFakeReporteUsuario({ uid: "uid-1", nombre: "JUAN PÉREZ TORRES" }),
    ];
    port.desglosePorUsuarioResponse = {
      fechaInicioSemana: "2026-06-16T00:00:00Z",
      ventas: [
        makeFakeVentaCobranza({
          ventaId: 1001,
          clienteId: 777,
          clienteNombre: "MARÍA LÓPEZ SOTO",
          aporte: "1.00",
          aplicaPonderado: true,
        }),
      ],
      resumen: { numerador: "1.00", denominador: 1, pctPonderado: "100.0" },
    };

    renderScreen(port);

    const row = await screen.findByText("JUAN PÉREZ TORRES");
    await user.click(row);

    // Desglose dialog renders the venta cliente
    const dialog = await screen.findByRole("dialog");
    const clienteLink = await within(dialog).findByRole("button", {
      name: /Ver ficha de MARÍA LÓPEZ SOTO/i,
    });

    await user.click(clienteLink);

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe(
        "/clientes/777",
      ),
    );
    expect(port.desglosePorUsuarioCalls[0].uid).toBe("uid-1");
  });

  it("desglose colorea el estado segun el aporte (green/amber/red)", async () => {
    const user = userEvent.setup();
    const port = new FakeRutasPort();
    port.reporteUsuariosResponse = [makeFakeReporteUsuario({ uid: "uid-1" })];
    port.desglosePorUsuarioResponse = {
      fechaInicioSemana: "2026-06-16T00:00:00Z",
      ventas: [
        makeFakeVentaCobranza({
          ventaId: 1,
          clienteId: 1,
          clienteNombre: "CUBRIO",
          aporte: "1.00",
          aplicaPonderado: true,
        }),
        makeFakeVentaCobranza({
          ventaId: 2,
          clienteId: 2,
          clienteNombre: "PARCIAL",
          aporte: "0.50",
          aplicaPonderado: true,
        }),
        makeFakeVentaCobranza({
          ventaId: 3,
          clienteId: 3,
          clienteNombre: "SIN PAGO",
          aporte: "0",
          aplicaPonderado: true,
        }),
        makeFakeVentaCobranza({
          ventaId: 4,
          clienteId: 4,
          clienteNombre: "NO APLICA",
          aporte: "1.00",
          aplicaPonderado: false,
        }),
      ],
      resumen: { numerador: "1.50", denominador: 3, pctPonderado: "50.0" },
    };

    renderScreen(port);
    await user.click(await screen.findByText("ZONA CENTRO"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Cubrió")).toBeInTheDocument();
    expect(within(dialog).getByText("Parcial")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin pago")).toBeInTheDocument();
    expect(within(dialog).getByText("No aplica")).toBeInTheDocument();
  });
});
