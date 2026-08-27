/**
 * Maps domain entities/VOs → HTTP request body objects.
 * The body interfaces below mirror the Go server DTOs in
 * internal/ventas/infra/venthttp/dto.go.
 */
import type { HeaderInput, ClienteInput, LineasInput, VendedoresInput } from "../../application/ports/VentaEditPort";

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

/** PUT /v2/ventas/{id}/lineas — las dos colecciones, un solo cuerpo. */
export type ReemplazarLineasBody = {
  combos: ComboDTOBody[];
  productos: ProductoDTOBody[];
};

export type VendedorDTOBody = {
  id: string;
  usuario_id: string;
  email: string;
  nombre: string;
};

/** PUT /v2/ventas/{id}/vendedores */
export type ReemplazarVendedoresBody = {
  vendedores: VendedorDTOBody[];
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

function toProductoDTOBody(p: LineasInput["productos"][number]): ProductoDTOBody {
  const base = {
    id: p.id,
    articulo_id: p.articuloID,
    articulo: p.articulo,
    cantidad: p.cantidad.toV2String(),
    precio_anual: p.precioAnual.toV2String(),
    precio_corto: p.precioCorto.toV2String(),
    precio_contado: p.precioContado.toV2String(),
  };
  if (p.comboID !== null) {
    // Parte de un combo: hereda los almacenes del combo, así que van en null.
    return { ...base, combo_id: p.comboID, almacen_origen_id: null, almacen_destino_id: null };
  }
  // Producto suelto: la entidad garantiza que almacenes no es null.
  return {
    ...base,
    combo_id: null,
    almacen_origen_id: p.almacenes!.origenID,
    almacen_destino_id: p.almacenes!.destinoID,
  };
}

function toComboDTOBody(c: LineasInput["combos"][number]): ComboDTOBody {
  return {
    id: c.id,
    nombre: c.nombre,
    precio_anual: c.precioAnual.toV2String(),
    precio_corto: c.precioCorto.toV2String(),
    precio_contado: c.precioContado.toV2String(),
    cantidad: c.cantidad.toV2String(),
    almacen_origen_id: c.almacenes.origenID,
    almacen_destino_id: c.almacenes.destinoID,
  };
}

export function toReemplazarLineasBody(input: LineasInput): ReemplazarLineasBody {
  return {
    combos: input.combos.map(toComboDTOBody),
    productos: input.productos.map(toProductoDTOBody),
  };
}

export function toReemplazarVendedoresBody(input: VendedoresInput): ReemplazarVendedoresBody {
  return {
    vendedores: input.vendedores.map((v) => ({
      id: v.id,
      usuario_id: v.usuarioID,
      email: v.email,
      nombre: v.nombre,
    })),
  };
}
