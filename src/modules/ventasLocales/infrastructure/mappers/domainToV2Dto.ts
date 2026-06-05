/**
 * Maps domain entities/VOs → HTTP request body objects.
 * The body interfaces below mirror the Go server DTOs in
 * internal/ventas/infra/venthttp/dto.go.
 */
import type { HeaderInput, ClienteInput, ProductosInput, CombosInput } from "../../application/ports/VentaEditPort";

// ---------------------------------------------------------------------------
// Body type definitions (mirrors Go DTOs)
// ---------------------------------------------------------------------------

export type DireccionBody = {
  calle: string;
  numero_exterior: string | null;
  colonia: string;
  poblacion: string;
  ciudad: string;
  zona_cliente_id: number | null;
};

export type GPSBody = {
  latitud: number;
  longitud: number;
};

export type MontosBody = {
  anual: string;
  corto_plazo: string;
  contado: string;
};

export type PlanCreditoBody = {
  plazo_meses: number;
  enganche: string;
  parcialidad: string;
  frec_pago: "SEMANAL" | "QUINCENAL" | "MENSUAL";
};

export type DiaCobranzaBody = {
  semana: string | null;
  mes: number | null;
};

/** PATCH /v2/ventas/{id} */
export type ActualizarHeaderBody = {
  direccion: DireccionBody;
  gps: GPSBody;
  fecha_venta: string;
  montos: MontosBody;
  plan_credito: PlanCreditoBody | null;
  dia_cobranza: DiaCobranzaBody | null;
  nota: string | null;
};

/** PATCH /v2/ventas/{id}/cliente */
export type ActualizarClienteBody = {
  cliente: {
    cliente_id: number | null;
    nombre: string;
    telefono: string | null;
    aval: string | null;
    referencia: string | null;
  };
};

export type ProductoDTOBody = {
  id: string;
  articulo_id: number;
  articulo: string;
  cantidad: string;
  precio_anual: string;
  precio_corto: string;
  precio_contado: string;
  combo_id: string | null;
  almacen_origen_id: number | null;
  almacen_destino_id: number | null;
};

/** PUT /v2/ventas/{id}/productos */
export type ReemplazarProductosBody = {
  productos: ProductoDTOBody[];
};

export type ComboDTOBody = {
  id: string;
  nombre: string;
  precio_anual: string;
  precio_corto: string;
  precio_contado: string;
  cantidad: string;
  almacen_origen_id: number;
  almacen_destino_id: number;
};

/** PUT /v2/ventas/{id}/combos */
export type ReemplazarCombosBody = {
  combos: ComboDTOBody[];
};

// ---------------------------------------------------------------------------
// Mapper functions
// ---------------------------------------------------------------------------

export function toActualizarHeaderBody(input: HeaderInput): ActualizarHeaderBody {
  const { direccion, gps, fechaVenta, montos, planCredito, diaCobranza, nota } = input;

  let planCreditoBody: PlanCreditoBody | null = null;
  if (planCredito !== null) {
    planCreditoBody = {
      plazo_meses: planCredito.plazoMeses,
      enganche: planCredito.enganche.toV2String(),
      parcialidad: planCredito.parcialidad.toV2String(),
      frec_pago: planCredito.frecPago,
    };
  }

  let diaCobranzaBody: DiaCobranzaBody | null = null;
  if (diaCobranza !== null) {
    if (diaCobranza.kind === "semana") {
      diaCobranzaBody = { semana: diaCobranza.dia, mes: null };
    } else {
      diaCobranzaBody = { semana: null, mes: diaCobranza.dia };
    }
  }

  return {
    direccion: {
      calle: direccion.calle,
      numero_exterior: direccion.numeroExterior,
      colonia: direccion.colonia,
      poblacion: direccion.poblacion,
      ciudad: direccion.ciudad,
      zona_cliente_id: direccion.zonaClienteID,
    },
    gps: {
      latitud: gps.latitud,
      longitud: gps.longitud,
    },
    fecha_venta: fechaVenta,
    montos: {
      anual: montos.anual.toV2String(),
      corto_plazo: montos.cortoPlazo.toV2String(),
      contado: montos.contado.toV2String(),
    },
    plan_credito: planCreditoBody,
    dia_cobranza: diaCobranzaBody,
    nota,
  };
}

export function toActualizarClienteBody(input: ClienteInput): ActualizarClienteBody {
  const { cliente } = input;
  return {
    cliente: {
      cliente_id: cliente.clienteID,
      nombre: cliente.nombre.value,
      telefono: cliente.telefono?.value ?? null,
      aval: cliente.aval,
      referencia: cliente.referencia,
    },
  };
}

export function toReemplazarProductosBody(input: ProductosInput): ReemplazarProductosBody {
  const productos: ProductoDTOBody[] = input.productos.map((p) => {
    if (p.comboID !== null) {
      // Part of a combo — almacenes are null
      return {
        id: p.id,
        articulo_id: p.articuloID,
        articulo: p.articulo,
        cantidad: p.cantidad.toV2String(),
        precio_anual: p.precioAnual.toV2String(),
        precio_corto: p.precioCorto.toV2String(),
        precio_contado: p.precioContado.toV2String(),
        combo_id: p.comboID,
        almacen_origen_id: null,
        almacen_destino_id: null,
      };
    }
    // Not in a combo — almacenes are set
    return {
      id: p.id,
      articulo_id: p.articuloID,
      articulo: p.articulo,
      cantidad: p.cantidad.toV2String(),
      precio_anual: p.precioAnual.toV2String(),
      precio_corto: p.precioCorto.toV2String(),
      precio_contado: p.precioContado.toV2String(),
      combo_id: null,
      almacen_origen_id: p.almacenes!.origenID,
      almacen_destino_id: p.almacenes!.destinoID,
    };
  });

  return { productos };
}

export function toReemplazarCombosBody(input: CombosInput): ReemplazarCombosBody {
  const combos: ComboDTOBody[] = input.combos.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    precio_anual: c.precioAnual.toV2String(),
    precio_corto: c.precioCorto.toV2String(),
    precio_contado: c.precioContado.toV2String(),
    cantidad: c.cantidad.toV2String(),
    almacen_origen_id: c.almacenes.origenID,
    almacen_destino_id: c.almacenes.destinoID,
  }));

  return { combos };
}
