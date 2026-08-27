import { describe, expect, it, vi } from "vitest";

import { guardarEdicionVenta } from "./guardarEdicionVenta";
import type { VentaEditPort } from "../ports/VentaEditPort";
import type { EdicionVentaInput } from "../dto/EdicionVentaInput";
import { ventaV2ToDomain } from "../../infrastructure/mappers/ventaV2ToDomain";
import { DomainError } from "../../domain/errors";
import { ventaConComboDTO } from "@/test/msw/fixtures/ventaConCombo";

function makePort(overrides: Partial<VentaEditPort> = {}) {
  const venta = ventaV2ToDomain(ventaConComboDTO());
  const port: VentaEditPort = {
    obtenerVenta: vi.fn(async () => venta),
    actualizarHeader: vi.fn(async () => venta),
    actualizarCliente: vi.fn(async () => venta),
    reemplazarLineas: vi.fn(async () => venta),
    reemplazarVendedores: vi.fn(async () => venta),
    adjuntarImagen: vi.fn(),
    eliminarImagen: vi.fn(async () => undefined),
    ...overrides,
  } as VentaEditPort;
  return { port, venta };
}

function inputConLineas(venta: ReturnType<typeof ventaV2ToDomain>): EdicionVentaInput {
  return {
    ventaActual: venta,
    cambios: {
      lineas: { combos: venta.combos, productos: venta.productos },
      imagenesNuevas: [],
      imagenesAEliminar: [],
    },
  };
}

describe("guardarEdicionVenta — un solo paso para combos y productos", () => {
  it("manda las dos colecciones en UNA llamada y registra el paso 'lineas'", async () => {
    const { port, venta } = makePort();

    const result = await guardarEdicionVenta({ port }, inputConLineas(venta));

    expect(port.reemplazarLineas).toHaveBeenCalledTimes(1);
    expect(port.reemplazarLineas).toHaveBeenCalledWith({
      ventaID: venta.id,
      combos: venta.combos,
      productos: venta.productos,
    });
    expect(result.pasosExitosos).toEqual(["lineas"]);
    expect(result.errorParcial).toBeNull();
  });

  it("el puerto ya no expone los dos reemplazos separados", () => {
    const { port } = makePort();

    expect("reemplazarCombos" in port).toBe(false);
    expect("reemplazarProductos" in port).toBe(false);
  });

  it("sin cambios de líneas no llama al endpoint", async () => {
    const { port, venta } = makePort();

    const result = await guardarEdicionVenta(
      { port },
      { ventaActual: venta, cambios: { imagenesNuevas: [], imagenesAEliminar: [] } },
    );

    expect(port.reemplazarLineas).not.toHaveBeenCalled();
    expect(result.pasosExitosos).toEqual([]);
  });

  it("un 422 del servidor se reporta como error del paso 'lineas' y detiene el resto", async () => {
    const { port, venta } = makePort({
      reemplazarLineas: vi.fn(async () => {
        throw new DomainError(
          "producto_combo_referencia_invalida",
          "el combo referenciado por el producto no existe en la venta",
        );
      }),
    });

    const input = inputConLineas(venta);
    const result = await guardarEdicionVenta(
      { port },
      {
        ...input,
        cambios: { ...input.cambios, vendedores: venta.vendedores },
      },
    );

    expect(result.errorParcial?.paso).toBe("lineas");
    expect(result.errorParcial?.error.code).toBe("producto_combo_referencia_invalida");
    expect(result.pasosExitosos).toEqual([]);
    // No sigue con vendedores: la venta no queda a medio guardar.
    expect(port.reemplazarVendedores).not.toHaveBeenCalled();
  });
});
