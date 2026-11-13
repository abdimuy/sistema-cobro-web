import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GarantiasOficinaScreen } from "../GarantiasOficinaScreen";

const mocks = vi.hoisted(() => ({
  permisos: vi.fn(),
  bandeja: vi.fn(),
  detalle: vi.fn(),
  catalogos: vi.fn(),
}));

vi.mock("../../presentation/hooks/usePermisosGarantias", () => ({
  usePermisosGarantias: mocks.permisos,
}));

vi.mock("../../presentation/hooks/useGarantias", () => ({
  useBandejaGarantias: mocks.bandeja,
  useDetalleGarantia: mocks.detalle,
}));

vi.mock("../../presentation/hooks/useCatalogosGarantias", () => ({
  useCatalogosGarantias: mocks.catalogos,
}));

vi.mock("../ComandoArticuloForm", () => ({
  ComandoArticuloForm: () => <div>Formulario de artículo</div>,
}));

vi.mock("../ComandoFolioForm", () => ({
  ComandoFolioForm: () => <div>Formulario de folio</div>,
}));

vi.mock("../VisorImagenGarantia", () => ({
  VisorImagenGarantia: () => <div>Visor de evidencia</div>,
}));

const garantia = {
  id: "garantia-1",
  folio: "G-001",
  origen: "cliente",
  cliente_id: 15,
  estado: "abierto",
  description: "Garantía de prueba",
  abierto_por: "usuario-1",
  created_at: "2026-11-13T14:00:00Z",
  updated_at: "2026-11-13T14:00:00Z",
  articulos: [],
};

const detalle = {
  garantia,
  eventos: [],
};

describe("GarantiasOficinaScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.permisos.mockReturnValue({
      permisos: ["garantias:leer"],
      cargando: false,
      error: null,
    });

    mocks.catalogos.mockReturnValue({
      catalogos: {
        estados: ["abierto", "cerrado"],
        etapas: ["registrado"],
        ubicaciones: ["taller"],
        tipos_evento: [],
        transiciones: [],
      },
      cargando: false,
      error: null,
    });

    mocks.bandeja.mockReturnValue({
      pagina: {
        items: [garantia],
        next_cursor: "cursor-2",
        has_more: true,
      },
      cargando: false,
      error: null,
    });

    mocks.detalle.mockImplementation((id: string | null) => ({
      detalle: id === "garantia-1" ? detalle : null,
      cargando: false,
      error: null,
    }));
  });

  it("espera los permisos antes de montar la bandeja", () => {
    mocks.permisos.mockReturnValue({
      permisos: [],
      cargando: true,
      error: null,
    });

    render(<GarantiasOficinaScreen />);

    expect(screen.getByText("Comprobando permisos de Garantías..."))
      .toBeTruthy();
    expect(mocks.bandeja).not.toHaveBeenCalled();
    expect(mocks.catalogos).not.toHaveBeenCalled();
  });

  it("bloquea la bandeja si falla la consulta de permisos", () => {
    mocks.permisos.mockReturnValue({
      permisos: [],
      cargando: false,
      error: "HTTP 401",
    });

    render(<GarantiasOficinaScreen />);

    expect(screen.getByRole("alert").textContent)
      .toContain("HTTP 401");
    expect(mocks.bandeja).not.toHaveBeenCalled();
  });

  it("impide consultar garantías sin permiso de lectura", () => {
    mocks.permisos.mockReturnValue({
      permisos: ["garantias:crear"],
      cargando: false,
      error: null,
    });

    render(<GarantiasOficinaScreen />);

    expect(
      screen.getByText("No tienes permiso para consultar garantías."),
    ).toBeTruthy();
    expect(mocks.bandeja).not.toHaveBeenCalled();
  });

  it("muestra la bandeja con un folio autorizado", () => {
    render(<GarantiasOficinaScreen />);

    expect(screen.getByText("Garantías de oficina")).toBeTruthy();
    expect(screen.getByRole("button", { name: /G-001/ })).toBeTruthy();
    expect(mocks.bandeja).toHaveBeenCalled();
  });

  it("muestra el detalle al seleccionar un folio", () => {
    render(<GarantiasOficinaScreen />);

    fireEvent.click(screen.getByRole("button", { name: /G-001/ }));

    expect(mocks.detalle).toHaveBeenLastCalledWith("garantia-1", 0);
    expect(screen.getByText("Formulario de folio")).toBeTruthy();
    expect(screen.getByText("Formulario de artículo")).toBeTruthy();
    expect(screen.getByText("Evidencias fotográficas")).toBeTruthy();
  });

  it("aplica los filtros seleccionados a la bandeja", () => {
    render(<GarantiasOficinaScreen />);

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "cerrado" },
    });

    expect(mocks.bandeja).toHaveBeenLastCalledWith(
      expect.objectContaining({ estado: "cerrado" }),
      undefined,
    );
  });

  it("envía el cursor al avanzar de página", () => {
    render(<GarantiasOficinaScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(mocks.bandeja).toHaveBeenLastCalledWith(
      expect.any(Object),
      "cursor-2",
    );
    expect(screen.getByText("Página 2")).toBeTruthy();
  });

  it("muestra el mensaje de bandeja vacía", () => {
    mocks.bandeja.mockReturnValue({
      pagina: {
        items: [],
        next_cursor: "",
        has_more: false,
      },
      cargando: false,
      error: null,
    });

    render(<GarantiasOficinaScreen />);

    expect(
      screen.getByText("No se encontraron garantías con esos filtros."),
    ).toBeTruthy();

    expect(
      (screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("permite regresar a la página anterior", () => {
    render(<GarantiasOficinaScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Página 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

    expect(screen.getByText("Página 1")).toBeTruthy();
    expect(mocks.bandeja).toHaveBeenLastCalledWith(
      expect.any(Object),
      undefined,
    );
  });

  it("reinicia la paginación al cambiar el origen", () => {
    render(<GarantiasOficinaScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    fireEvent.change(screen.getByLabelText("Origen"), {
      target: { value: "piso" },
    });

    expect(screen.getByText("Página 1")).toBeTruthy();
    expect(mocks.bandeja).toHaveBeenLastCalledWith(
      expect.objectContaining({ origen: "piso" }),
      undefined,
    );
  });

  it("aplica filtros de etapa, ubicación y cliente", () => {
    render(<GarantiasOficinaScreen />);

    fireEvent.change(screen.getByLabelText("Etapa"), {
      target: { value: "registrado" },
    });

    fireEvent.change(screen.getByLabelText("Ubicación"), {
      target: { value: "taller" },
    });

    fireEvent.change(screen.getByLabelText("ID cliente"), {
      target: { value: "15" },
    });

    expect(mocks.bandeja).toHaveBeenLastCalledWith(
      expect.objectContaining({
        etapa: "registrado",
        ubicacion: "taller",
        cliente_id: 15,
      }),
      undefined,
    );
  });

  it("muestra un error de catálogos sin ocultar la bandeja", () => {
    mocks.catalogos.mockReturnValue({
      catalogos: null,
      cargando: false,
      error: "No disponibles",
    });

    render(<GarantiasOficinaScreen />);

    expect(screen.getByText(/No se pudieron cargar los filtros/))
      .toBeTruthy();
    expect(screen.getByRole("button", { name: /G-001/ }))
      .toBeTruthy();
  });

  it("muestra un error de la bandeja", () => {
    mocks.bandeja.mockReturnValue({
      pagina: null,
      cargando: false,
      error: "Error 500",
    });

    render(<GarantiasOficinaScreen />);

    expect(screen.getByText("Error 500")).toBeTruthy();
  });

});
