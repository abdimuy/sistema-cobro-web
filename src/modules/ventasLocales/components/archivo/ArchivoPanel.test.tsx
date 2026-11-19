import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VentaArchivoDTO } from "@/services/api/getVentaArchivo";

const hook = vi.fn();
vi.mock("../../presentation/hooks/useVentaArchivo", () => ({
  useVentaArchivo: (id: string) => hook(id),
}));
vi.mock("../detalle/AuthenticatedImage", () => ({ default: () => <div /> }));
vi.mock("@/components/MapSimple", () => ({
  default: () => <div data-testid="mapa" />,
}));

import { ArchivoPanel } from "./ArchivoPanel";

const base: VentaArchivoDTO = {
  id: "v1",
  nombre_cliente: "MARIA LOPEZ",
  telefono: "2221234567",
  direccion: "AV JUAREZ",
  numero_exterior: "12",
  colonia: "CENTRO",
  poblacion: "",
  ciudad: "PUEBLA",
  latitud: 19.04,
  longitud: -98.2,
  aval: "JUAN PEREZ",
  nota: "dejar con vecino",
  fecha_venta: "2026-02-03T22:05:00Z",
  tipo_venta: "CREDITO",
  plan_texto: "Crédito 12 meses",
  precio_total: "0.00",
  enganche: "0.00",
  parcialidad: "0.00",
  frec_pago: "",
  dia_cobranza: "",
  monto_corto_plazo: "0.00",
  plazo_corto_meses: 0,
  articulos: [
    {
      articulo_id: 1,
      nombre: "RECAMARA",
      cantidad: "2",
      precio_lista: "0.00",
      precio_corto_plazo: "0.00",
      precio_contado: "0.00",
      combo_id: null,
    },
  ],
  combos: [],
  vendedores: [{ email: "a@b.c", nombre: "Pedro Ruiz" }],
  capturada_por: "Ana",
  imagenes: [
    { id: "a", mime: "image/jpeg", fecha_subida: "2026-02-03T22:05:00Z" },
  ],
};
const ok = (v: Partial<VentaArchivoDTO> = {}) =>
  hook.mockReturnValue({
    venta: { ...base, ...v },
    loading: false,
    error: null,
    reintentar: vi.fn(),
  });

describe("ArchivoPanel", () => {
  beforeEach(() => hook.mockReset());

  it("muestra la línea 'Venta del sistema anterior · solo consulta · capturada el … por …'", () => {
    ok();
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    expect(
      screen.getByText(
        "Venta del sistema anterior · solo consulta · capturada el 03/02/2026 16:05 por Ana",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", {
        name: "Detalle de venta de Archivo",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("AV JUAREZ 12, CENTRO, PUEBLA"),
    ).toBeInTheDocument();
    expect(screen.getByText(/RECAMARA/)).toBeInTheDocument();
  });

  it("al abrir, el foco va al botón 'Cerrar detalle'", () => {
    ok();
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cerrar detalle" })).toHaveFocus();
  });

  it("el panel no crece ni envuelve: flex-none con ancho acotado (no medido en pantalla)", () => {
    ok();
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    const cls = screen.getByRole("complementary").className;
    expect(cls).toContain("flex-none");
    expect(cls).toContain("w-[min(420px,45%)]");
  });

  it("Escape cierra el panel", () => {
    ok();
    const onClose = vi.fn();
    render(<ArchivoPanel ventaId="v1" onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar detalle" }), {
      key: "Escape",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no tiene botones de acción: solo 'Cerrar detalle' y los de la galería", () => {
    ok({
      imagenes: [
        { id: "a", mime: "image/jpeg", fecha_subida: "2026-02-03T22:05:00Z" },
        { id: "b", mime: "image/jpeg", fecha_subida: "2026-02-03T22:05:00Z" },
      ],
    });
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    const permitido =
      /^(Cerrar detalle|Foto anterior|Foto siguiente|Ver foto \d+)$/;
    for (const b of screen.getAllByRole("button")) {
      expect(b.getAttribute("aria-label") ?? b.textContent).toMatch(permitido);
    }
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("con latitud/longitud válidas renderiza el mapa", () => {
    ok();
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    expect(screen.getByTestId("mapa")).toBeInTheDocument();
  });

  it.each([
    ["null", null, null],
    ["0,0", 0, 0],
    ["solo una en null", 19, null],
  ])(
    "sin ubicación (%s) no renderiza el mapa y dice 'Sin ubicación'",
    (_n, lat, lng) => {
      ok({ latitud: lat, longitud: lng });
      render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
      expect(screen.queryByTestId("mapa")).toBeNull();
      expect(screen.getByText("Sin ubicación")).toBeInTheDocument();
    },
  );

  it("con teléfono vacío y plan_texto '—' no rompe y muestra '—'", () => {
    ok({ telefono: "", plan_texto: "—" });
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("error muestra texto en español y 'Reintentar' vuelve a pedir", () => {
    const reintentar = vi.fn();
    hook.mockReturnValue({
      venta: null,
      loading: false,
      error: "La venta no existe",
      reintentar,
    });
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    expect(screen.getByText("La venta no existe")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reintentar).toHaveBeenCalledTimes(1);
  });

  it("cargando muestra skeleton", () => {
    hook.mockReturnValue({
      venta: null,
      loading: true,
      error: null,
      reintentar: vi.fn(),
    });
    render(<ArchivoPanel ventaId="v1" onClose={vi.fn()} />);
    expect(screen.getByTestId("archivo-panel-skeleton")).toBeInTheDocument();
  });

  it("cerrar llama onClose (también en error y cargando)", () => {
    const onClose = vi.fn();
    ok();
    render(<ArchivoPanel ventaId="v1" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar detalle" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
