import type { VentaV2, ComboV2, ProductoV2 } from "../../../services/api/ventaV2Types";

// Fixture de la venta que reprodujo el fallo de producción: un combo con dos
// productos dentro y un producto suelto. Editar el contenido del combo era
// imposible en la pantalla, y el rodeo (borrar el combo y crear otro) mandaba
// productos apuntando a un combo inexistente — el 422
// `producto_combo_referencia_invalida` que aparece doce veces en
// MSP_FAILED_INTENTS entre el 14 y el 24 de agosto.

export const VENTA_ID = "7c3a1e52-9d64-4f31-8c0a-2b5f77a10001";
export const COMBO_ID = "a1b2c3d4-1111-4a2b-9c3d-000000000011";
export const PRODUCTO_COMBO_1_ID = "a1b2c3d4-2222-4a2b-9c3d-000000000021";
export const PRODUCTO_COMBO_2_ID = "a1b2c3d4-2222-4a2b-9c3d-000000000022";
export const PRODUCTO_SUELTO_ID = "a1b2c3d4-3333-4a2b-9c3d-000000000031";

export const ALMACEN_ORIGEN = 19;
export const ALMACEN_DESTINO = 11058;

export const comboSala: ComboV2 = {
  id: COMBO_ID,
  nombre: "Sala Roma 3 piezas",
  precio_anual: "18500.00",
  precio_corto: "16900.00",
  precio_contado: "14500.00",
  cantidad: "1",
  almacen_origen_id: ALMACEN_ORIGEN,
  almacen_destino_id: ALMACEN_DESTINO,
};

export const sofaDelCombo: ProductoV2 = {
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
};

export const sillonDelCombo: ProductoV2 = {
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
};

export const mesaSuelta: ProductoV2 = {
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
};

/** Venta en borrador (editable) con combo + productos. */
export function ventaConComboDTO(overrides: Partial<VentaV2> = {}): VentaV2 {
  return {
    id: VENTA_ID,
    cliente: {
      cliente_id: 24037,
      nombre: "MARIA GUADALUPE ZAVALETA RUIZ",
      telefono: "4491234567",
      aval: null,
      referencia: null,
    },
    direccion: {
      calle: "AV LOS MAESTROS",
      numero_exterior: "418",
      colonia: "CENTRO",
      poblacion: "AGUASCALIENTES",
      ciudad: "AGUASCALIENTES",
      zona_cliente_id: 7,
    },
    gps: { latitud: 21.8853, longitud: -102.2916 },
    fecha_venta: "2026-08-14T17:30:00Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "borrador",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "24000.00", corto_plazo: "22000.00", contado: "18400.00" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [comboSala],
    productos: [sofaDelCombo, sillonDelCombo, mesaSuelta],
    vendedores: [
      {
        id: "d4e5f6a7-4444-4a2b-9c3d-000000000041",
        usuario_id: "d4e5f6a7-5555-4a2b-9c3d-000000000051",
        email: "roberto.ledesma@muebleriamsp.mx",
        nombre: "Roberto Ledesma",
      },
    ],
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: "2026-08-14T17:30:00Z",
    updated_at: "2026-08-14T17:30:00Z",
    created_by: "d4e5f6a7-5555-4a2b-9c3d-000000000051",
    updated_by: "d4e5f6a7-5555-4a2b-9c3d-000000000051",
    ...overrides,
  };
}

/** La misma venta pero 100 % combos: ni un producto suelto. */
export function ventaSoloCombosDTO(overrides: Partial<VentaV2> = {}): VentaV2 {
  return ventaConComboDTO({
    productos: [sofaDelCombo, sillonDelCombo],
    ...overrides,
  });
}
