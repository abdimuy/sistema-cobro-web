import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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
    onViewDetails: (v: VentaLocal, retorno?: HTMLElement | null) => void;
  }) => (
    <div>
      {ventas.map((v) => (
        <span key={v.LOCAL_SALE_ID}>
          <button onClick={() => onViewDetails(v)}>fila-{v.LOCAL_SALE_ID}</button>
          <button
            onClick={() =>
              onViewDetails(v, hookState.__retorno as HTMLElement | undefined)
            }
          >
            menu-{v.LOCAL_SALE_ID}
          </button>
        </span>
      ))}
    </div>
  ),
}));
vi.mock("./components/VentasFilters", () => ({ VentasFilters: () => null }));
vi.mock("./components/VentasViewSwitcher", () => ({ VentasViewSwitcher: () => null }));
vi.mock("./components/VentasColumnSelector", () => ({
  VentasColumnSelector: () => <div data-testid="selector-columnas" />,
}));

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

  // Layout NO medido en pantalla (jsdom no calcula anchos): solo clases.
  it("el contenedor no envuelve y la tabla cede ancho al panel", () => {
    renderScreen();
    expect(screen.getByTestId("ventas-contenido").className).toContain("flex-nowrap");
    expect(screen.getByTestId("ventas-contenido").className).not.toMatch(/(^|\s)flex-wrap/);
    const col = screen.getByTestId("ventas-tabla-col").className;
    expect(col).toContain("flex-1");
    expect(col).toContain("min-w-0");
    expect(col).toContain("basis-0");
  });

  it("abierto desde el menú, al cerrar el foco vuelve al destino que entregó la fila", () => {
    renderScreen();
    const destino = screen.getByText("fila-x2");
    hookState.__retorno = destino;
    fireEvent.click(screen.getByText("menu-x1"));
    fireEvent.click(screen.getByText("cerrar-panel"));
    expect(destino).toHaveFocus();
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

  it("limpiar filtros restablece origen a 'app'", () => {
    hookState.ventas = [];
    hookState.params = { origen: "archivo" };
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: /limpiar/i }));
    expect(setParams).toHaveBeenCalledWith(
      expect.objectContaining({ origen: "app" }),
    );
  });

  it("sin origen elegido el filtro marca App", () => {
    hookState.params = {};
    renderScreen();
    expect(screen.getByRole("button", { name: /^App/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("las pestañas de origen no muestran totales", () => {
    hookState.conteoOrigen = { app: 5, archivo: 7 };
    renderScreen();
    expect(screen.getByRole("group", { name: "Origen" })).not.toHaveTextContent(/\d/);
  });

  it("el deep link ?ventaId= sigue abriendo el modal de app", () => {
    renderScreen("/?ventaId=deep1");
    expect(screen.getByTestId("modal-app")).toHaveTextContent("deep1");
  });
});

describe("VentasLocales: barra de filtros angosta", () => {
  let ancho = 0;
  const original = globalThis.ResizeObserver;
  beforeEach(() => {
    globalThis.ResizeObserver = class {
      private cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
      }
      observe() {
        this.cb([{ contentRect: { width: ancho } } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });
  afterEach(() => {
    globalThis.ResizeObserver = original;
  });

  it("ancha: Columnas en línea y sin menú Más", () => {
    ancho = 1200;
    renderScreen();
    expect(screen.getByTestId("selector-columnas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Más opciones" })).not.toBeInTheDocument();
  });

  it("angosta: Columnas y Densidad pasan al menú Más", () => {
    ancho = 800;
    renderScreen();
    expect(screen.queryByTestId("selector-columnas")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
    expect(screen.getByTestId("selector-columnas")).toBeInTheDocument();
    expect(screen.getByText("Densidad")).toBeInTheDocument();
  });
});
