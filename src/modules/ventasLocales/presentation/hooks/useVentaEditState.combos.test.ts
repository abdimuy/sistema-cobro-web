import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useVentaEditState } from "./useVentaEditState";
import {
  ventaConComboDTO,
  ventaSoloCombosDTO,
  COMBO_ID,
  PRODUCTO_COMBO_1_ID,
  PRODUCTO_COMBO_2_ID,
  PRODUCTO_SUELTO_ID,
  ALMACEN_ORIGEN,
  ALMACEN_DESTINO,
  mesaSuelta,
  comboSala,
} from "@/test/msw/fixtures/ventaConCombo";

// Índices en formData tal como los proyecta el hook desde el DTO:
// productos = [sofá(combo), sillón(combo), mesa(suelto)], combos = [sala].
const SOFA = 0;
const SILLON = 1;
const MESA = 2;
const COMBO = 0;

describe("useVentaEditState — productos DENTRO de un combo", () => {
  it("agregar un producto al combo lo deja apuntando al combo y sin almacenes propios", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.addProducto({
        articuloId: 45077,
        articulo: "Mesa lateral Roma",
        cantidad: 1,
        precioAnual: 1800,
        precioCortoPlazo: 1600,
        precioContado: 1400,
        comboID: COMBO_ID,
        almacenOrigenID: null,
        almacenDestinoID: null,
      });
    });

    const nuevo = result.current.formData.productos.find((p) => p.articuloId === 45077);
    expect(nuevo?.comboID).toBe(COMBO_ID);
    expect(nuevo?.almacenOrigenID).toBeNull();
    expect(result.current.errors).toEqual([]);
    expect(result.current.isDirty).toBe(true);
  });

  it("cambiar el contenido del combo produce UN solo cambio de líneas con las DOS colecciones", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    // Quita el sillón del combo y mete otro artículo en su lugar.
    act(() => {
      result.current.removeProducto(SILLON);
      result.current.addProducto({
        articuloId: 45077,
        articulo: "Mesa lateral Roma",
        cantidad: 1,
        precioAnual: 1800,
        precioCortoPlazo: 1600,
        precioContado: 1400,
        comboID: COMBO_ID,
        almacenOrigenID: null,
        almacenDestinoID: null,
      });
    });

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;

    const lineas = out.input.cambios.lineas;
    expect(lineas).toBeDefined();
    // El combo NO cambió, pero viaja igual: el endpoint reemplaza las dos.
    expect(lineas!.combos.map((c) => c.id)).toEqual([COMBO_ID]);
    expect(lineas!.productos.map((p) => p.articulo)).toEqual([
      "Sofá 3 plazas Roma",
      "Mesa de centro Bilbao",
      "Mesa lateral Roma",
    ]);
    expect(
      lineas!.productos.filter((p) => p.comboID === COMBO_ID).map((p) => p.articulo),
    ).toEqual(["Sofá 3 plazas Roma", "Mesa lateral Roma"]);
    // Ya no existen los dos pasos separados.
    expect("productos" in out.input.cambios).toBe(false);
    expect("combos" in out.input.cambios).toBe(false);
  });

  it("editar la cantidad de un producto del combo marca cambio y viaja en líneas", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.updateProducto(SOFA, "cantidad", 3);
    });

    expect(result.current.isDirty).toBe(true);
    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const sofa = out.input.cambios.lineas!.productos.find((p) => p.id === PRODUCTO_COMBO_1_ID);
    expect(sofa?.cantidad.toV2String()).toBe("3");
  });
});

describe("useVentaEditState — cascada al quitar un combo", () => {
  it("quitar el combo se lleva sus productos y NO deja huérfanos en el cuerpo", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.removeCombo(COMBO);
    });

    const productos = result.current.formData.productos;
    expect(productos[SOFA].isDeleted).toBe(true);
    expect(productos[SILLON].isDeleted).toBe(true);
    expect(productos[MESA].isDeleted).toBeFalsy();

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;

    const lineas = out.input.cambios.lineas!;
    expect(lineas.combos).toEqual([]);
    expect(lineas.productos.map((p) => p.id)).toEqual([PRODUCTO_SUELTO_ID]);
    expect(lineas.productos.every((p) => p.comboID === null)).toBe(true);
  });

  it("quitar un combo recién agregado borra también los productos que nacieron dentro", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.addCombo({
        nombre: "Recámara Oslo",
        cantidad: 1,
        precioAnual: 9000,
        precioCortoPlazo: 8200,
        precioContado: 7000,
        almacenOrigenID: ALMACEN_ORIGEN,
        almacenDestinoID: ALMACEN_DESTINO,
      });
    });

    const nuevoComboID = result.current.formData.combos[1].id;

    act(() => {
      result.current.addProducto({
        articuloId: 46001,
        articulo: "Cabecera Oslo matrimonial",
        cantidad: 1,
        precioAnual: 5000,
        precioCortoPlazo: 4600,
        precioContado: 4000,
        comboID: nuevoComboID,
        almacenOrigenID: null,
        almacenDestinoID: null,
      });
    });

    act(() => {
      result.current.removeCombo(1);
    });

    expect(result.current.formData.combos).toHaveLength(1);
    expect(
      result.current.formData.productos.some((p) => p.comboID === nuevoComboID),
    ).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("restaurar el combo devuelve sólo los productos que cayeron por la cascada", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    // El usuario borra el sillón a mano y DESPUÉS quita el combo.
    act(() => {
      result.current.removeProducto(SILLON);
    });
    act(() => {
      result.current.removeCombo(COMBO);
    });
    act(() => {
      result.current.restoreCombo(COMBO);
    });

    const productos = result.current.formData.productos;
    expect(productos[SOFA].isDeleted).toBe(false);
    expect(productos[SILLON].isDeleted).toBe(true); // seguía borrado a mano
    expect(result.current.formData.combos[COMBO].isDeleted).toBe(false);

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.input.cambios.lineas!.productos.map((p) => p.id)).toEqual([
      PRODUCTO_COMBO_1_ID,
      PRODUCTO_SUELTO_ID,
    ]);
  });
});

describe("useVentaEditState — validación de combos antes de guardar", () => {
  it("una cantidad no positiva en el combo se marca ANTES de guardar", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.updateCombo(COMBO, "cantidad", -2);
    });

    expect(result.current.errors).toContainEqual({
      field: `combos[${COMBO_ID}].cantidad`,
      message: "la cantidad debe ser mayor a cero",
    });
    expect(result.current.getInput().ok).toBe(false);
  });

  it("un precio negativo en el combo se marca ANTES de guardar", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.updateCombo(COMBO, "precioContado", -1);
    });

    expect(result.current.errors).toContainEqual({
      field: `combos[${COMBO_ID}].precioContado`,
      message: "el monto no puede ser negativo",
    });
  });

  it("un producto que apunta a un combo ausente se marca en vez de salir a la red", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.updateProducto(SILLON, "comboID", "00000000-0000-4000-8000-000000000999");
    });

    expect(result.current.errors).toContainEqual({
      field: `productos[${PRODUCTO_COMBO_2_ID}].combo`,
      message: "el combo del producto ya no existe en la venta",
    });
    expect(result.current.getInput().ok).toBe(false);
  });

  it("la cantidad de un producto se indexa por id, que es como la busca la tabla", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => {
      result.current.updateProducto(SOFA, "cantidad", 0);
    });

    expect(result.current.errors).toContainEqual({
      field: `productos[${PRODUCTO_COMBO_1_ID}].cantidad`,
      message: "la cantidad debe ser mayor a cero",
    });
  });
});

describe("useVentaEditState — almacenes por defecto", () => {
  it("una venta 100 % combos hereda el almacén del combo, no {0, 0}", () => {
    const { result } = renderHook(() => useVentaEditState(ventaSoloCombosDTO()));

    expect(result.current.formData.almacenes).toEqual({
      almacenOrigenID: ALMACEN_ORIGEN,
      almacenDestinoID: ALMACEN_DESTINO,
    });
  });

  it("con productos sueltos manda el par del producto suelto", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    expect(result.current.formData.almacenes).toEqual({
      almacenOrigenID: ALMACEN_ORIGEN,
      almacenDestinoID: ALMACEN_DESTINO,
    });
  });

  it("agregar un combo en una venta 100 % combos sale con almacén válido", () => {
    const { result } = renderHook(() => useVentaEditState(ventaSoloCombosDTO()));

    act(() => {
      result.current.addCombo({
        nombre: "Comedor Sevilla 6 sillas",
        cantidad: 1,
        precioAnual: 15000,
        precioCortoPlazo: 13800,
        precioContado: 12000,
        almacenOrigenID: result.current.formData.almacenes.almacenOrigenID,
        almacenDestinoID: result.current.formData.almacenes.almacenDestinoID,
      });
    });

    expect(result.current.errors).toEqual([]);
    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const nuevo = out.input.cambios.lineas!.combos.find(
      (c) => c.nombre === "Comedor Sevilla 6 sillas",
    );
    expect(nuevo?.almacenes.origenID).toBe(ALMACEN_ORIGEN);
    expect(nuevo?.almacenes.destinoID).toBe(ALMACEN_DESTINO);
  });
});

describe("useVentaEditState — la cascada aguanta el ida y vuelta", () => {
  it("quitar, restaurar, quitar y restaurar deja la venta como estaba", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.removeCombo(COMBO));
    act(() => result.current.restoreCombo(COMBO));
    act(() => result.current.removeCombo(COMBO));
    act(() => result.current.restoreCombo(COMBO));

    const productos = result.current.formData.productos;
    expect(productos.map((p) => p.isDeleted === true)).toEqual([false, false, false]);
    // La bandera transitoria no se queda pegada: si quedara, un borrado a mano
    // posterior se revertiría solo al restaurar el combo.
    expect(productos.map((p) => p.deletedByCombo === true)).toEqual([false, false, false]);
    expect(result.current.isDirty).toBe(false);
  });

  it("el borrado a mano sobrevive a dos ciclos de quitar y restaurar el combo", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.removeProducto(SILLON));
    act(() => result.current.removeCombo(COMBO));
    act(() => result.current.restoreCombo(COMBO));
    act(() => result.current.removeCombo(COMBO));
    act(() => result.current.restoreCombo(COMBO));

    const productos = result.current.formData.productos;
    expect(productos[SOFA].isDeleted).toBe(false);
    expect(productos[SILLON].isDeleted).toBe(true);
    expect(productos[MESA].isDeleted).toBe(false);

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.input.cambios.lineas!.productos.map((p) => p.id)).toEqual([
      PRODUCTO_COMBO_1_ID,
      PRODUCTO_SUELTO_ID,
    ]);
  });

  it("un combo se puede quedar sin productos: el cuerpo lo lleva igual", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.removeProducto(SOFA));
    act(() => result.current.removeProducto(SILLON));

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.input.cambios.lineas!.combos.map((c) => c.id)).toEqual([COMBO_ID]);
    expect(out.input.cambios.lineas!.productos.map((p) => p.id)).toEqual([PRODUCTO_SUELTO_ID]);
  });

  it("quedarse sin NINGÚN producto no sale a la red: lo paran los dos guardas", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.removeCombo(COMBO));
    act(() => result.current.removeProducto(MESA));

    expect(result.current.errors).toContainEqual({
      field: "productos",
      message: "debe haber al menos un producto activo",
    });
    // getInput es el último antes de la red y tiene que decir lo mismo que
    // `errors`: con productos vacíos el servidor responde 422
    // venta_productos_vacios.
    const out = result.current.getInput();
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.errors.map((e) => e.field)).toContain("productos");
  });
});

describe("useVentaEditState — qué viaja y qué no", () => {
  it("sin ningún cambio no se arma ningún paso", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.input.cambios.lineas).toBeUndefined();
    expect(out.input.cambios.header).toBeUndefined();
    expect(out.input.cambios.cliente).toBeUndefined();
    expect(out.input.cambios.vendedores).toBeUndefined();
    expect(out.input.cambios.imagenesNuevas).toEqual([]);
    expect(out.input.cambios.imagenesAEliminar).toEqual([]);
    expect(result.current.isDirty).toBe(false);
  });

  it("un cambio SÓLO de cabecera no arrastra las líneas", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.updateFinanciero("nota", "ENTREGAR POR LA TARDE"));

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.input.cambios.header).toBeDefined();
    expect(out.input.cambios.lineas).toBeUndefined();
  });

  it("un cambio SÓLO de combos arrastra también los productos", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.updateCombo(COMBO, "precioContado", 13900));

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.input.cambios.lineas!.productos).toHaveLength(3);
    expect(out.input.cambios.header).toBeUndefined();
  });

  it("un cambio SÓLO de un producto suelto arrastra también los combos", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.updateProducto(MESA, "precioContado", 1500));

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.input.cambios.lineas!.combos.map((c) => c.id)).toEqual([COMBO_ID]);
  });
});

describe("useVentaEditState — el par de almacenes por defecto", () => {
  it("con empate se queda con el primer par visto, sin depender del orden del Map", () => {
    const { result } = renderHook(() =>
      useVentaEditState(
        ventaConComboDTO({
          productos: [
            { ...mesaSuelta, id: PRODUCTO_SUELTO_ID, almacen_origen_id: 19, almacen_destino_id: 11058 },
            { ...mesaSuelta, id: "a1b2c3d4-3333-4a2b-9c3d-000000000032", articulo_id: 45091, almacen_origen_id: 20, almacen_destino_id: 11058 },
          ],
          combos: [],
        }),
      ),
    );

    expect(result.current.formData.almacenes).toEqual({
      almacenOrigenID: 19,
      almacenDestinoID: 11058,
    });
  });

  it("gana el par más repetido, no el primero", () => {
    const { result } = renderHook(() =>
      useVentaEditState(
        ventaConComboDTO({
          productos: [
            { ...mesaSuelta, id: PRODUCTO_SUELTO_ID, almacen_origen_id: 20, almacen_destino_id: 11058 },
            { ...mesaSuelta, id: "a1b2c3d4-3333-4a2b-9c3d-000000000033", articulo_id: 45092, almacen_origen_id: 19, almacen_destino_id: 11058 },
            { ...mesaSuelta, id: "a1b2c3d4-3333-4a2b-9c3d-000000000034", articulo_id: 45093, almacen_origen_id: 19, almacen_destino_id: 11058 },
          ],
          combos: [],
        }),
      ),
    );

    expect(result.current.formData.almacenes).toEqual({
      almacenOrigenID: 19,
      almacenDestinoID: 11058,
    });
  });

  it("con combos de almacenes distintos gana el más repetido entre combos", () => {
    const { result } = renderHook(() =>
      useVentaEditState(
        ventaSoloCombosDTO({
          combos: [
            { ...comboSala, id: COMBO_ID, almacen_origen_id: 20, almacen_destino_id: 11058 },
            { ...comboSala, id: "a1b2c3d4-1111-4a2b-9c3d-000000000012", almacen_origen_id: 19, almacen_destino_id: 11058 },
            { ...comboSala, id: "a1b2c3d4-1111-4a2b-9c3d-000000000013", almacen_origen_id: 19, almacen_destino_id: 11058 },
          ],
        }),
      ),
    );

    expect(result.current.formData.almacenes).toEqual({
      almacenOrigenID: 19,
      almacenDestinoID: 11058,
    });
  });
});

describe("useVentaEditState — los almacenes del producto suelto también se marcan", () => {
  it("un almacén inválido en un suelto sale en errors, no sólo al confirmar", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    act(() => result.current.updateProducto(MESA, "almacenOrigenID", 0));

    // Antes esto sólo lo veía getInput: el pie decía "sin errores", el botón
    // quedaba habilitado y el guardado moría con un aviso genérico.
    expect(result.current.errors).toContainEqual({
      field: `productos[${PRODUCTO_SUELTO_ID}].almacenes`,
      message: "los ids de almacén deben ser enteros positivos",
    });

    const out = result.current.getInput();
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.errors).toContainEqual({
      field: `productos[${PRODUCTO_SUELTO_ID}].almacenes`,
      message: "los ids de almacén deben ser enteros positivos",
    });
  });

  it("el hijo de un combo NO se valida por almacenes: los hereda", () => {
    const { result } = renderHook(() => useVentaEditState(ventaConComboDTO()));

    expect(
      result.current.errors.filter((e) => e.field.endsWith(".almacenes")),
    ).toEqual([]);
  });
});
