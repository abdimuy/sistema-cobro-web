import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import type { VentaLocal } from "../../services/api/getVentasLocales";

// Pantalla real (VentasTable + fila + vista previa); solo se simulan los datos,
// las imágenes y el contenido de los paneles.
const setParams = vi.fn();
let hookState: Record<string, unknown>;

vi.mock("./presentation/composition/VentasListContainer", () => ({
  VentasListContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./presentation/hooks/useBuscarVentas", () => ({
  useBuscarVentas: () => hookState,
}));
vi.mock("./presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: () => ({ eventos: [], isLoading: false, error: null }),
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
vi.mock("./components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <span>{alt}</span>,
}));
vi.mock("./components/archivo/ArchivoPanel", () => ({
  ArchivoPanel: ({
    ventaId,
    onClose,
    fotoInicial,
  }: {
    ventaId: string;
    onClose: () => void;
    fotoInicial?: { indice: number };
  }) => (
    <div data-testid="panel-archivo" data-foto={fotoInicial ? String(fotoInicial.indice) : "none"}>
      {ventaId}
      <button onClick={onClose}>cerrar-panel</button>
    </div>
  ),
}));
vi.mock("./components/VentasFilters", () => ({ VentasFilters: () => null }));
vi.mock("./components/VentasViewSwitcher", () => ({ VentasViewSwitcher: () => null }));
vi.mock("./components/VentasColumnSelector", () => ({ VentasColumnSelector: () => null }));

import VentasLocales from "./VentasLocales";

const fotos = [1, 2, 3, 4, 5].map((n) => ({
  id: `img-${n}`,
  descripcion: null,
  created_at: "2026-08-10T18:30:00Z",
  mime: "image/jpeg",
}));

const venta = (id: string, origen: "app" | "archivo"): VentaLocal =>
  ({
    LOCAL_SALE_ID: id,
    ORIGEN: origen,
    NOMBRE_CLIENTE: `Cliente ${id}`,
    FECHA_VENTA: "2026-08-10T18:00:00Z",
    IMAGENES: fotos,
  }) as unknown as VentaLocal;

beforeEach(() => {
  hookState = {
    ventas: [venta("a1", "app"), venta("x1", "archivo")],
    loading: false,
    loadingMore: false,
    error: null,
    params: {},
    hasMore: false,
    setParams,
    updateSort: vi.fn(),
    loadMore: vi.fn(),
    refetch: vi.fn(),
    conteoOrigen: { app: 1, archivo: 1 },
  };
});

const renderScreen = () =>
  render(
    <MemoryRouter>
      <VentasLocales />
    </MemoryRouter>,
  );

describe("VentasLocales: vista previa de fotos", () => {
  it("Archivo: clic en la miniatura 4 abre el panel en la foto 4 y NO abre el detalle de la fila", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.hover(screen.getByRole("button", { name: /5 fotos de Cliente x1/ }));
    await user.click(await screen.findByRole("button", { name: "Ver foto: Foto 4" }));
    const panel = screen.getByTestId("panel-archivo");
    expect(panel).toHaveTextContent("x1");
    expect(panel.getAttribute("data-foto")).toBe("3");
    expect(screen.queryByTestId("modal-app")).toBeNull();
  });

  it("Archivo: al cerrar el panel el foco vuelve a la pila de esa fila y la tarjeta no se reabre", async () => {
    const user = userEvent.setup();
    renderScreen();
    const pila = screen.getByRole("button", { name: /5 fotos de Cliente x1/ });
    await user.hover(pila);
    await user.click(await screen.findByRole("button", { name: "Ver foto: Foto 2" }));
    await user.click(screen.getByText("cerrar-panel"));
    expect(pila).toHaveFocus();
    await new Promise((r) => setTimeout(r, 350));
    expect(screen.queryByRole("button", { name: "Ver foto: Foto 2" })).toBeNull();
  });

  it("app: clic en una miniatura o dentro del visor no abre el detalle de la fila", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.hover(screen.getByRole("button", { name: /5 fotos de Cliente a1/ }));
    await user.click(await screen.findByRole("button", { name: "Ver foto: Foto 4" }));
    await user.click(await screen.findByTitle(/Zoom in/));
    expect(screen.queryByTestId("modal-app")).toBeNull();
    expect(screen.queryByTestId("panel-archivo")).toBeNull();
  });
});
