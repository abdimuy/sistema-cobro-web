import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { VentaV2 } from "@/services/api/ventaV2Types";
import VentaDetalleHero from "./VentaDetalleHero";

function makeVenta(overrides: Partial<VentaV2> = {}): VentaV2 {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: { cliente_id: null, nombre: "Cliente Demo", telefono: null, aval: null, referencia: null },
    direccion: {
      calle: "Calle",
      numero_exterior: "12",
      colonia: "Centro",
      poblacion: "Pueblo",
      ciudad: "Ciudad",
      zona_cliente_id: 1,
    },
    gps: { latitud: 0, longitud: 0 },
    fecha_venta: "2026-06-09T01:22:32Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "aprobada",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "1000", corto_plazo: "1200", contado: "900" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [],
    productos: [],
    vendedores: [],
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: "2026-06-09T01:22:32Z",
    updated_at: "2026-06-09T01:22:32Z",
    created_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    updated_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    ...overrides,
  };
}

describe("VentaDetalleHero — estatus cliente badge", () => {
  it("shows the estatus badge when cliente_id is set and estatus is known", () => {
    render(
      <VentaDetalleHero
        venta={makeVenta({
          cliente: { cliente_id: 24037, nombre: "Cliente Demo", telefono: null, aval: null, referencia: null },
          estatus_cliente_microsip: "A",
        })}
      />
    );
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("does not show the estatus badge when cliente_id is null", () => {
    render(
      <VentaDetalleHero
        venta={makeVenta({
          cliente: { cliente_id: null, nombre: "Cliente Demo", telefono: null, aval: null, referencia: null },
          estatus_cliente_microsip: "A",
        })}
      />
    );
    expect(screen.queryByText("Activo")).not.toBeInTheDocument();
    // "Cliente nuevo" pill shows instead when cliente_id is null.
    expect(screen.getByText("Cliente nuevo")).toBeInTheDocument();
  });

  it("does not show the estatus badge when estatus is absent", () => {
    render(
      <VentaDetalleHero
        venta={makeVenta({
          cliente: { cliente_id: 24037, nombre: "Cliente Demo", telefono: null, aval: null, referencia: null },
          estatus_cliente_microsip: undefined,
        })}
      />
    );
    expect(screen.queryByText("Activo")).not.toBeInTheDocument();
    expect(screen.queryByText("Suspensión de ventas")).not.toBeInTheDocument();
  });

  it("does not show the estatus badge when estatus is unknown", () => {
    render(
      <VentaDetalleHero
        venta={makeVenta({
          cliente: { cliente_id: 24037, nombre: "Cliente Demo", telefono: null, aval: null, referencia: null },
          estatus_cliente_microsip: "Z",
        })}
      />
    );
    expect(screen.queryByText("Z")).not.toBeInTheDocument();
  });
});

describe("VentaDetalleHero — los montos son TOTALES, y lo dicen", () => {
  // El encabezado lee `montos.*` tal cual del API: son totales de la venta.
  // La tabla de artículos de la misma pantalla usaba la palabra "Contado"
  // para un precio UNITARIO. Con las dos sin apellido, una venta de 8 sillas
  // capturada con el total en el campo de contado y el unitario en el de
  // anual quedó con $61,600 de contado sobre una deuda de $11,200 y nadie lo
  // vio antes de que llegara a Microsip.

  it("rotula el monto grande como total, no como 'precio'", () => {
    render(<VentaDetalleHero venta={makeVenta({ tipo_venta: "CREDITO" })} />);

    expect(screen.getByText("Total anual")).toBeInTheDocument();
    expect(screen.queryByText("Precio anual")).toBeNull();
  });

  it("y en una venta de contado dice total de contado", () => {
    render(<VentaDetalleHero venta={makeVenta({ tipo_venta: "CONTADO" })} />);

    // Dos veces: el monto grande y el del pie, que en una venta de contado
    // son el mismo número.
    expect(screen.getAllByText("Total contado")).toHaveLength(2);
    expect(screen.queryByText("Precio contado")).toBeNull();
  });

  it("los montos del pie también dicen que son totales", () => {
    render(<VentaDetalleHero venta={makeVenta({ tipo_venta: "CREDITO" })} />);

    expect(screen.getByText("Total contado")).toBeInTheDocument();
    expect(screen.getByText("Total corto plazo")).toBeInTheDocument();
  });
});
