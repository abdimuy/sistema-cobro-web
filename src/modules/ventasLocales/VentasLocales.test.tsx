import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { VentaLocal } from "../../services/api/getVentasLocales";

const setParams = vi.fn();
let hookState: Record<string, unknown>;

vi.mock("./presentation/composition/VentasListContainer", () => ({
  VentasListContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./presentation/hooks/useBuscarVentas", () => ({
  useBuscarVentas: () => hookState,
}));
vi.mock("@/hooks/useGetAlmacenes", () => ({
  default: () => ({ getAlmacenById: () => undefined }),
}));
vi.mock("@/hooks/useGetZonasCliente", () => ({ default: () => ({ zonas: [] }) }));
vi.mock("@/hooks/useGetVendedores", () => ({ default: () => ({ vendedores: [] }) }));
vi.mock("./components/detalle", () => ({
  VentaDetalleModal: ({ ventaId }: { ventaId: string }) => (
    <div data-testid="modal-app">{ventaId}</div>
  ),
}));
vi.mock("./components/archivo/ArchivoPanel", () => ({
  ArchivoPanel: ({ ventaId, onClose }: { ventaId: string; onClose: () => void }) => (
    <div data-testid="panel-archivo">
      {ventaId}
      <button onClick={onClose}>cerrar-panel</button>
    </div>
  ),
}));
vi.mock("./components/VentasTable", () => ({
  VentasTable: ({
    ventas,
    onViewDetails,
  }: {
    ventas: VentaLocal[];
    onViewDetails: (v: VentaLocal) => void;
  }) => (
    <div>
      {ventas.map((v) => (
        <button key={v.LOCAL_SALE_ID} onClick={() => onViewDetails(v)}>
          fila-{v.LOCAL_SALE_ID}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("./components/VentasFilters", () => ({ VentasFilters: () => null }));
vi.mock("./components/VentasViewSwitcher", () => ({ VentasViewSwitcher: () => null }));
vi.mock("./components/VentasColumnSelector", () => ({ VentasColumnSelector: () => null }));

import VentasLocales from "./VentasLocales";

const venta = (id: string, origen?: "app" | "archivo") =>
  ({ LOCAL_SALE_ID: id, ORIGEN: origen }) as unknown as VentaLocal;

function renderScreen(url = "/") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <VentasLocales />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  setParams.mockClear();
  hookState = {
    ventas: [venta("a1", "app"), venta("x1", "archivo"), venta("x2", "archivo")],
    loading: false,
    loadingMore: false,
    error: null,
    params: {},
    hasMore: false,
    setParams,
    updateSort: vi.fn(),
    loadMore: vi.fn(),
    refetch: vi.fn(),
    conteoOrigen: { app: 5, archivo: 7 },
  };
});

describe("VentasLocales: Archivo y origen", () => {
  it("clic en venta de app abre VentaDetalleModal y no el panel", () => {
    renderScreen();
    fireEvent.click(screen.getByText("fila-a1"));
    expect(screen.getByTestId("modal-app")).toHaveTextContent("a1");
    expect(screen.queryByTestId("panel-archivo")).toBeNull();
  });

  it("clic en venta de Archivo abre ArchivoPanel y no el modal", () => {
    renderScreen();
    fireEvent.click(screen.getByText("fila-x1"));
    expect(screen.getByTestId("panel-archivo")).toHaveTextContent("x1");
    expect(screen.queryByTestId("modal-app")).toBeNull();
  });

  it("al cerrar el panel el foco vuelve a la fila que lo abrió", () => {
    renderScreen();
    const fila = screen.getByText("fila-x1");
    fila.focus();
    fireEvent.click(fila);
    const cerrar = screen.getByText("cerrar-panel");
    cerrar.focus(); // el foco se mudó al panel
    expect(fila).not.toHaveFocus();
    fireEvent.click(cerrar);
    expect(fila).toHaveFocus();
  });

  it("abrir otra venta de Archivo reemplaza el panel", () => {
    renderScreen();
    fireEvent.click(screen.getByText("fila-x1"));
    fireEvent.click(screen.getByText("fila-x2"));
    expect(screen.getAllByTestId("panel-archivo")).toHaveLength(1);
    expect(screen.getByTestId("panel-archivo")).toHaveTextContent("x2");
  });

  it("cerrar el panel lo oculta", () => {
    renderScreen();
    fireEvent.click(screen.getByText("fila-x1"));
    fireEvent.click(screen.getByText("cerrar-panel"));
    expect(screen.queryByTestId("panel-archivo")).toBeNull();
  });

  it("elegir 'Archivo' en OrigenFiltro llama setParams({origen:'archivo'})", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: /^Archivo/ }));
    expect(setParams).toHaveBeenCalledWith({ origen: "archivo" });
  });

  it("cambiar el origen con el panel abierto no lo cierra", () => {
    renderScreen();
    fireEvent.click(screen.getByText("fila-x1"));
    fireEvent.click(screen.getByRole("button", { name: /^App/ }));
    expect(screen.getByTestId("panel-archivo")).toBeInTheDocument();
  });

  it("limpiar filtros restablece origen a 'todas'", () => {
    hookState.ventas = [];
    hookState.params = { origen: "archivo" };
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: /limpiar/i }));
    expect(setParams).toHaveBeenCalledWith(
      expect.objectContaining({ origen: "todas" }),
    );
  });

  it("con conteoOrigen.archivo null el filtro muestra 'Archivo —'", () => {
    hookState.conteoOrigen = { app: 5, archivo: null };
    renderScreen();
    expect(screen.getByRole("button", { name: /Archivo\s+—/ })).toBeInTheDocument();
  });

  it("el deep link ?ventaId= sigue abriendo el modal de app", () => {
    renderScreen("/?ventaId=deep1");
    expect(screen.getByTestId("modal-app")).toHaveTextContent("deep1");
  });
});
