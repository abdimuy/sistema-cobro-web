import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { VentaLocal } from "@/services/api/getVentasLocales";
import type { VentaEvento } from "../domain/entities/VentaEvento";

vi.mock("../presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: vi.fn(),
}));

import { FaseCell } from "./FaseCell";
import { useVentaEventos } from "../presentation/hooks/useVentaEventos";

const mockUseVentaEventos = vi.mocked(useVentaEventos);

const AHORA = new Date("2026-08-18T18:00:00Z");
const MS_POR_DIA = 86_400_000;

const VENTA: VentaLocal = {
  LOCAL_SALE_ID: "7c2f1e40-9a3b-4c1d-8e55-2b7d4f6a9c31",
  USER_EMAIL: "carmelo.luna@muebleriamsp.mx",
  ALMACEN_ID: 19,
  NOMBRE_CLIENTE: "Eleazar Alva Rojas",
  FECHA_VENTA: "2026-08-12T15:04:00Z",
  LATITUD: 18.36,
  LONGITUD: -97.4,
  DIRECCION: "Av. Independencia 214",
  PRECIO_TOTAL: 21450,
  TELEFONO: "2381234567",
  ESTADO: "active",
  SITUACION: "aprobada",
  SINCRONIZACION: "pendiente",
};

const evento = (eventType: string, iso: string): VentaEvento => ({
  id: `${eventType}-${iso}`,
  eventType,
  payload: {},
  occurredAt: new Date(iso),
  actorNombre: "Óscar Roque Castillo",
});

const sinEventos = { eventos: [] as VentaEvento[], isLoading: false, error: null };

const celda = () => screen.getByRole("button", { name: /fase/i });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(AHORA);
  mockUseVentaEventos.mockReset();
  mockUseVentaEventos.mockReturnValue(sinEventos);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FaseCell — la celda", () => {
  it("muestra el nombre de la fase y el tiempo que lleva en ella", () => {
    render(
      <FaseCell
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 3 * 3_600_000).toISOString() }}
      />
    );

    expect(screen.getByText("Aprobada")).toBeInTheDocument();
    expect(screen.getByText("hace 3 h")).toBeInTheDocument();
  });

  it("una venta detenida lo dice en el segundo renglón", () => {
    render(
      <FaseCell
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString() }}
      />
    );

    const meta = screen.getByText("detenida 6 d");
    expect(meta).toBeInTheDocument();
    expect(meta.className).toContain("text-fase-detenida");
  });

  it("sin fase_desde no dibuja segundo renglón", () => {
    render(<FaseCell venta={VENTA} />);

    expect(screen.getByText("Aprobada")).toBeInTheDocument();
    expect(screen.queryByTestId("fase-meta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fase-meta-compacta")).not.toBeInTheDocument();
  });

  it("en compacta se pliega: anillo de 18 px, sin segundo renglón", () => {
    render(
      <FaseCell
        compact
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 3 * 3_600_000).toISOString() }}
      />
    );

    expect(screen.getByTestId("fase-anillo")).toHaveAttribute("width", "18");
    expect(screen.queryByTestId("fase-meta")).not.toBeInTheDocument();
    expect(screen.queryByText("hace 3 h")).not.toBeInTheDocument();
  });

  it("en compacta sobreviven los días de una venta detenida", () => {
    render(
      <FaseCell
        compact
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString() }}
      />
    );

    expect(screen.getByText("6 d")).toBeInTheDocument();
    expect(screen.queryByText("detenida 6 d")).not.toBeInTheDocument();
  });

  it("el anillo lleva los arcos alcanzados y el tono de la fase", () => {
    render(<FaseCell venta={{ ...VENTA, SINCRONIZACION: "aplicada" }} />);

    const anillo = screen.getByTestId("fase-anillo");
    expect(anillo).toHaveAttribute("data-arcos", "4");
    expect(anillo).toHaveAttribute("data-tono", "aplicada");
    expect(anillo).toHaveAttribute("width", "28");
  });

  it("una cancelada dibuja el avance que traiga fase_alcanzada", () => {
    render(
      <FaseCell venta={{ ...VENTA, SITUACION: "cancelada", FASE_ALCANZADA: 2 }} />
    );

    const anillo = screen.getByTestId("fase-anillo");
    expect(anillo).toHaveAttribute("data-arcos", "2");
    expect(anillo).toHaveAttribute("data-tono", "fuera");
    expect(screen.getByText("llegó a revisada")).toBeInTheDocument();
  });
});

describe("FaseCell — el panel", () => {
  it("no pide los eventos mientras el panel está cerrado", () => {
    render(<FaseCell venta={VENTA} />);

    expect(mockUseVentaEventos).not.toHaveBeenCalled();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("se abre con el teclado y entonces sí pide los eventos", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(mockUseVentaEventos).toHaveBeenCalledWith(VENTA.LOCAL_SALE_ID);
    expect(celda()).toHaveAttribute("aria-expanded", "true");
  });

  it("la celda puede recibir foco", () => {
    render(<FaseCell venta={VENTA} />);

    expect(celda()).toHaveAttribute("tabindex", "0");
  });

  it("Escape cierra el panel abierto con teclado", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());
    fireEvent.keyDown(celda(), { key: "Escape" });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("el cursor tiene que detenerse: pasar de largo no pide nada", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.mouseEnter(celda());
    act(() => {
      vi.advanceTimersByTime(80);
    });
    fireEvent.mouseLeave(celda());
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockUseVentaEventos).not.toHaveBeenCalled();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("al detenerse el cursor abre el panel", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.mouseEnter(celda());
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("cerrar el panel desmonta el hook — la petición en vuelo se aborta", () => {
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());
    expect(mockUseVentaEventos).toHaveBeenCalled();

    fireEvent.blur(celda());
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("muestra el estado de carga", () => {
    mockUseVentaEventos.mockReturnValue({ eventos: [], isLoading: true, error: null });
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());

    expect(screen.getByText("Cargando bitácora")).toBeInTheDocument();
  });

  it("explica el error en vez de disculparse", () => {
    mockUseVentaEventos.mockReturnValue({
      eventos: [],
      isLoading: false,
      error: "el servidor no respondió",
    });
    render(<FaseCell venta={VENTA} />);

    fireEvent.focus(celda());

    expect(screen.getByText("No se pudo leer la bitácora")).toBeInTheDocument();
    expect(screen.getByText("el servidor no respondió")).toBeInTheDocument();
  });

  it("dibuja la bitácora real, con el hito pendiente sin fecha", () => {
    mockUseVentaEventos.mockReturnValue({
      eventos: [
        evento("venta.creada", "2026-08-12T11:04:00Z"),
        evento("venta.enviada_a_revision", "2026-08-12T18:22:00Z"),
        evento("venta.aprobada", "2026-08-12T19:40:00Z"),
      ],
      isLoading: false,
      error: null,
    });
    render(
      <FaseCell
        venta={{ ...VENTA, FASE_DESDE: new Date(AHORA.getTime() - 6 * MS_POR_DIA).toISOString() }}
      />
    );

    fireEvent.focus(celda());

    const panel = screen.getByRole("tooltip");
    expect(panel).toHaveTextContent("Capturada");
    expect(panel).toHaveTextContent("Aplicada en Microsip");
    expect(panel).toHaveTextContent("—");
    // El hito donde se quedó lleva los días detenida.
    expect(panel).toHaveTextContent("· 6 d");
  });
});
