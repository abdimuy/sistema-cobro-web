import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import VentaProductosTable from "./VentaProductosTable";
import type { VentaV2 } from "@/services/api/ventaV2Types";

// El caso que hizo falta esta pantalla, medido en producción:
//
// Una venta de 8 sillas llegó con el precio de contado CINCO VECES el anual.
// Quien capturó puso el total de las ocho ($7,700) en contado y en corto
// plazo, y el unitario ($1,400) en anual. El servidor multiplica los tres por
// la cantidad, así que la venta quedó con $61,600 de contado sobre una deuda
// de $11,200 — y eso se escribió en Microsip, donde alimenta el "Hoy liquida
// con" del cobrador y el ticket.
//
// La pantalla no calculaba mal. Usaba la palabra "CONTADO" para un unitario
// (esta tabla) y para un total (el encabezado) sin decir cuál era cuál, y
// sólo mostraba el subtotal del nivel que la venta cobra. El $61,600 no
// aparecía en ningún lado, así que el capturista no tenía cómo ver la
// incoherencia.

const UNITARIO_CONTADO = "7700.00";
const UNITARIO_CORTO = "7700.00";
const UNITARIO_ANUAL = "1400.00";

function makeVenta(overrides: Partial<VentaV2> = {}): VentaV2 {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: {
      cliente_id: null,
      nombre: "Cliente Demo",
      telefono: null,
      aval: null,
      referencia: null,
    },
    direccion: {
      calle: "Calle",
      numero_exterior: "12",
      colonia: "Centro",
      poblacion: "Pueblo",
      ciudad: "Ciudad",
      zona_cliente_id: 1,
    },
    gps: { latitud: 0, longitud: 0 },
    fecha_venta: "2026-09-02T00:38:00Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "aprobada",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "11200", corto_plazo: "61600", contado: "61600" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [],
    productos: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        articulo_id: 4210,
        articulo: "SILLA MADERA",
        cantidad: "8",
        precio_anual: UNITARIO_ANUAL,
        precio_corto: UNITARIO_CORTO,
        precio_contado: UNITARIO_CONTADO,
        combo_id: null,
        almacen_origen_id: 1,
        almacen_destino_id: 2,
      },
    ],
    vendedores: [],
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: "2026-09-02T00:38:00Z",
    updated_at: "2026-09-02T00:38:00Z",
    created_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    updated_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    ...overrides,
  } as unknown as VentaV2;
}

describe("VentaProductosTable — unitario contra importe", () => {
  it("distingue el precio unitario del importe en los encabezados", () => {
    render(<VentaProductosTable venta={makeVenta()} />);

    // Tres niveles × (unitario, importe). Sin estas etiquetas, "Contado"
    // nombra lo mismo aquí y en el encabezado, donde es un total.
    expect(screen.getAllByText("P. unitario")).toHaveLength(3);
    expect(screen.getAllByText("Importe")).toHaveLength(3);
  });

  it("muestra el importe de los TRES niveles por renglón, no sólo el que se cobra", () => {
    render(<VentaProductosTable venta={makeVenta()} />);

    const fila = screen.getByText("SILLA MADERA").closest("tr");
    expect(fila).not.toBeNull();
    const celdas = within(fila as HTMLElement);

    // El $61,600 de contado tiene que aparecer junto al $11,200 anual: es lo
    // único que deja ver que un precio está cinco veces sobre el otro.
    expect(celdas.getAllByText("$61,600")).toHaveLength(2); // contado y corto
    expect(celdas.getByText("$11,200")).toBeInTheDocument();
    expect(celdas.getAllByText("$7,700")).toHaveLength(2); // los unitarios
    expect(celdas.getByText("$1,400")).toBeInTheDocument();
  });

  it("totaliza los tres niveles al pie", () => {
    render(<VentaProductosTable venta={makeVenta()} />);

    const total = screen.getByText("Total").closest("tr");
    const celdas = within(total as HTMLElement);

    expect(celdas.getAllByText("$61,600")).toHaveLength(2);
    expect(celdas.getByText("$11,200")).toBeInTheDocument();
  });

  it("el combo aporta su importe y sus piezas no aportan ninguno", () => {
    const venta = makeVenta({
      productos: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          articulo_id: 900,
          articulo: "SOFA",
          cantidad: "1",
          precio_anual: "0",
          precio_corto: "0",
          precio_contado: "0",
          combo_id: "44444444-4444-4444-4444-444444444444",
          almacen_origen_id: null,
          almacen_destino_id: null,
        },
      ],
      combos: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          nombre: "SALA 3 PIEZAS",
          precio_anual: "5000",
          precio_corto: "4500",
          precio_contado: "4000",
          cantidad: "2",
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
      ],
    } as unknown as Partial<VentaV2>);
    render(<VentaProductosTable venta={venta} />);

    const filaCombo = screen.getByText("SALA 3 PIEZAS").closest("tr");
    const celdas = within(filaCombo as HTMLElement);

    expect(celdas.getByText("$10,000")).toBeInTheDocument(); // anual × 2
    expect(celdas.getByText("$9,000")).toBeInTheDocument(); // corto × 2
    expect(celdas.getByText("$8,000")).toBeInTheDocument(); // contado × 2

    const filaPieza = screen.getByText("SOFA").closest("tr");
    expect(within(filaPieza as HTMLElement).queryByText(/\$/)).toBeNull();
  });
});
