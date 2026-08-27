import { describe, expect, it } from "vitest";
import axios from "axios";

import { server } from "@/test/msw/server";
import { ventasEditHandlers, errorHuma } from "@/test/msw/handlers/ventasEdit";
import {
  ventaConComboDTO,
  COMBO_ID,
  PRODUCTO_COMBO_1_ID,
  PRODUCTO_COMBO_2_ID,
  PRODUCTO_SUELTO_ID,
  VENTA_ID,
  ALMACEN_ORIGEN,
  ALMACEN_DESTINO,
} from "@/test/msw/fixtures/ventaConCombo";

import { HttpVentaEditAdapter } from "./HttpVentaEditAdapter";
import { ventaV2ToDomain } from "../mappers/ventaV2ToDomain";
import { DomainError } from "../../domain/errors";

const TEST_BASE_URL = "http://api.test/v2";

function makeAdapter() {
  return new HttpVentaEditAdapter(axios.create({ baseURL: TEST_BASE_URL }));
}

const ventaDominio = () => ventaV2ToDomain(ventaConComboDTO());

describe("HttpVentaEditAdapter.reemplazarLineas", () => {
  it("manda combos y productos en UN solo PUT /lineas, campo por campo", async () => {
    const dto = ventaConComboDTO();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: dto });
    server.use(...handlers);

    const venta = ventaDominio();
    const out = await makeAdapter().reemplazarLineas({
      ventaID: venta.id,
      combos: venta.combos,
      productos: venta.productos,
    });

    expect(llamadas.lineas).toHaveLength(1);
    expect(llamadas.lineas[0].ventaID).toBe(VENTA_ID);
    expect(llamadas.lineas[0].body).toEqual({
      combos: [
        {
          id: COMBO_ID,
          nombre: "Sala Roma 3 piezas",
          precio_anual: "18500.00",
          precio_corto: "16900.00",
          precio_contado: "14500.00",
          cantidad: "1",
          almacen_origen_id: ALMACEN_ORIGEN,
          almacen_destino_id: ALMACEN_DESTINO,
        },
      ],
      productos: [
        {
          id: PRODUCTO_COMBO_1_ID,
          articulo_id: 45012,
          articulo: "Sofá 3 plazas Roma",
          cantidad: "1",
          precio_anual: "12000.00",
          precio_corto: "11000.00",
          precio_contado: "9500.00",
          combo_id: COMBO_ID,
          almacen_origen_id: null,
          almacen_destino_id: null,
        },
        {
          id: PRODUCTO_COMBO_2_ID,
          articulo_id: 45013,
          articulo: "Sillón individual Roma",
          cantidad: "2",
          precio_anual: "3250.00",
          precio_corto: "2950.00",
          precio_contado: "2500.00",
          combo_id: COMBO_ID,
          almacen_origen_id: null,
          almacen_destino_id: null,
        },
        {
          id: PRODUCTO_SUELTO_ID,
          articulo_id: 45090,
          articulo: "Mesa de centro Bilbao",
          cantidad: "1",
          precio_anual: "2400.00",
          precio_corto: "2200.00",
          precio_contado: "1900.00",
          combo_id: null,
          almacen_origen_id: ALMACEN_ORIGEN,
          almacen_destino_id: ALMACEN_DESTINO,
        },
      ],
    });

    // Los endpoints viejos quedan sin tocar.
    expect(llamadas.combos).toBe(0);
    expect(llamadas.productos).toBe(0);

    expect(out.id).toBe(VENTA_ID);
    expect(out.combos).toHaveLength(1);
  });

  it("acepta combos vacíos: la venta se queda sin combos", async () => {
    const dto = ventaConComboDTO({ combos: [], productos: [] });
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: dto });
    server.use(...handlers);

    const venta = ventaDominio();
    await makeAdapter().reemplazarLineas({
      ventaID: venta.id,
      combos: [],
      productos: venta.productos.filter((p) => p.comboID === null),
    });

    const body = llamadas.lineas[0].body as { combos: unknown[]; productos: unknown[] };
    expect(body.combos).toEqual([]);
    expect(body.productos).toHaveLength(1);
  });

  it("409 venta_no_editable llega como DomainError con código y mensaje del servidor", async () => {
    const { handlers } = ventasEditHandlers({
      error: errorHuma(
        409,
        "Conflict",
        "venta_no_editable",
        "la venta no se puede editar en su estado actual",
      ),
    });
    server.use(...handlers);

    const venta = ventaDominio();
    await expect(
      makeAdapter().reemplazarLineas({
        ventaID: venta.id,
        combos: venta.combos,
        productos: venta.productos,
      }),
    ).rejects.toMatchObject({
      code: "venta_no_editable",
      message: "la venta no se puede editar en su estado actual",
    });
  });

  it("422 producto_combo_referencia_invalida llega con su código", async () => {
    const { handlers } = ventasEditHandlers({
      error: errorHuma(
        422,
        "Unprocessable Entity",
        "producto_combo_referencia_invalida",
        "el combo referenciado por el producto no existe en la venta",
      ),
    });
    server.use(...handlers);

    const venta = ventaDominio();
    const err = await makeAdapter()
      .reemplazarLineas({ ventaID: venta.id, combos: [], productos: venta.productos })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).code).toBe("producto_combo_referencia_invalida");
    expect((err as DomainError).message).toBe(
      "el combo referenciado por el producto no existe en la venta",
    );
  });

  it("422 venta_productos_vacios llega con su código", async () => {
    const { handlers } = ventasEditHandlers({
      error: errorHuma(
        422,
        "Unprocessable Entity",
        "venta_productos_vacios",
        "la venta requiere al menos un producto",
      ),
    });
    server.use(...handlers);

    const venta = ventaDominio();
    await expect(
      makeAdapter().reemplazarLineas({ ventaID: venta.id, combos: venta.combos, productos: [] }),
    ).rejects.toMatchObject({
      code: "venta_productos_vacios",
      message: "la venta requiere al menos un producto",
    });
  });

  it("el adaptador ya no expone los reemplazos separados de combos y productos", () => {
    const adapter = makeAdapter() as unknown as Record<string, unknown>;

    expect(typeof adapter.reemplazarLineas).toBe("function");
    expect(adapter.reemplazarCombos).toBeUndefined();
    expect(adapter.reemplazarProductos).toBeUndefined();
  });
});
