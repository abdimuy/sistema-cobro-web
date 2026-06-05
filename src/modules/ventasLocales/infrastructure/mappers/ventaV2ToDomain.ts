import type {
  VentaV2,
  ClienteSnapshotV2,
  DireccionV2,
  GPSV2,
  MontosV2,
  PlanCreditoV2,
  DiaCobranzaV2,
  ProductoV2,
  ComboV2,
  VendedorV2,
  ImagenV2,
} from "../../../../services/api/ventaV2Types";
import { Venta } from "../../domain/entities/Venta";
import type { Montos } from "../../domain/entities/Venta";
import { ClienteSnapshot } from "../../domain/entities/ClienteSnapshot";
import { Producto } from "../../domain/entities/Producto";
import { Combo } from "../../domain/entities/Combo";
import { Vendedor } from "../../domain/entities/Vendedor";
import { Imagen } from "../../domain/entities/Imagen";
import type { ImagenExistente } from "../../domain/entities/Imagen";
import { Monto } from "../../domain/values/Monto";
import { Cantidad } from "../../domain/values/Cantidad";
import { AlmacenesPair } from "../../domain/values/AlmacenesPair";
import { PlanCredito } from "../../domain/values/PlanCredito";
import type { FrecPago } from "../../domain/values/PlanCredito";
import { DiaCobranza } from "../../domain/values/DiaCobranza";
import { NombreCliente } from "../../domain/values/NombreCliente";
import { Telefono } from "../../domain/values/Telefono";
import { Direccion } from "../../domain/values/Direccion";
import { GPSCoords } from "../../domain/values/GPSCoords";
import { DomainError } from "../../domain/errors";

/**
 * Unwrap a VO result. If it is a DomainError, re-throw with field context.
 * This should not happen with backend data but acts as a safety net for
 * legacy/migrated data with bad values.
 */
function unwrap<T>(v: T | DomainError, ctx: string): T {
  if (v instanceof DomainError) {
    throw new DomainError(v.code, `${ctx}: ${v.message}`);
  }
  return v;
}

function mapDireccion(dto: DireccionV2): Direccion {
  return unwrap(
    Direccion.create({
      calle: dto.calle,
      numeroExterior: dto.numero_exterior,
      colonia: dto.colonia,
      poblacion: dto.poblacion,
      ciudad: dto.ciudad,
      zonaClienteID: dto.zona_cliente_id,
    }),
    "direccion",
  );
}

function mapGPS(dto: GPSV2): GPSCoords {
  return unwrap(GPSCoords.create(dto.latitud, dto.longitud), "gps");
}

function mapMontos(dto: MontosV2): Montos {
  return {
    anual: unwrap(Monto.create(dto.anual), "montos.anual"),
    cortoPlazo: unwrap(Monto.create(dto.corto_plazo), "montos.corto_plazo"),
    contado: unwrap(Monto.create(dto.contado), "montos.contado"),
  };
}

function mapPlanCredito(dto: PlanCreditoV2): PlanCredito {
  const enganche = unwrap(Monto.create(dto.enganche), "plan_credito.enganche");
  const parcialidad = unwrap(Monto.create(dto.parcialidad), "plan_credito.parcialidad");
  return unwrap(
    PlanCredito.create({
      plazoMeses: dto.plazo_meses,
      enganche,
      parcialidad,
      frecPago: dto.frec_pago as FrecPago,
    }),
    "plan_credito",
  );
}

function mapDiaCobranza(dto: DiaCobranzaV2): DiaCobranza | null {
  // Both null — no dia_cobranza set yet; treat as null (not an error).
  if (dto.semana === null && dto.mes === null) {
    return null;
  }
  if (dto.semana !== null) {
    return unwrap(DiaCobranza.semana(dto.semana), "dia_cobranza.semana");
  }
  // dto.mes is non-null here
  return unwrap(DiaCobranza.mes(dto.mes!), "dia_cobranza.mes");
}

function mapCliente(dto: ClienteSnapshotV2): ClienteSnapshot {
  const nombre = unwrap(NombreCliente.create(dto.nombre), "cliente.nombre");
  let telefono = null;
  if (dto.telefono !== null && dto.telefono.trim() !== "") {
    telefono = unwrap(Telefono.create(dto.telefono), "cliente.telefono");
  }
  return ClienteSnapshot.create({
    clienteID: dto.cliente_id,
    nombre,
    telefono,
    aval: dto.aval,
    referencia: dto.referencia,
  });
}

function mapProducto(dto: ProductoV2): Producto {
  const cantidad = unwrap(Cantidad.create(dto.cantidad), `producto[${dto.id}].cantidad`);
  const precioAnual = unwrap(Monto.create(dto.precio_anual), `producto[${dto.id}].precio_anual`);
  const precioCorto = unwrap(Monto.create(dto.precio_corto), `producto[${dto.id}].precio_corto`);
  const precioContado = unwrap(Monto.create(dto.precio_contado), `producto[${dto.id}].precio_contado`);

  let almacenes: AlmacenesPair | null = null;
  const comboID = dto.combo_id ?? null;

  if (comboID === null) {
    // Not in a combo — must have almacenes
    almacenes = unwrap(
      AlmacenesPair.create(dto.almacen_origen_id!, dto.almacen_destino_id!),
      `producto[${dto.id}].almacenes`,
    );
  }

  return unwrap(
    Producto.create({
      id: dto.id,
      articuloID: dto.articulo_id,
      articulo: dto.articulo,
      cantidad,
      precioAnual,
      precioCorto,
      precioContado,
      comboID,
      almacenes,
    }),
    `producto[${dto.id}]`,
  );
}

function mapCombo(dto: ComboV2): Combo {
  const precioAnual = unwrap(Monto.create(dto.precio_anual), `combo[${dto.id}].precio_anual`);
  const precioCorto = unwrap(Monto.create(dto.precio_corto), `combo[${dto.id}].precio_corto`);
  const precioContado = unwrap(Monto.create(dto.precio_contado), `combo[${dto.id}].precio_contado`);
  const cantidad = unwrap(Cantidad.create(dto.cantidad), `combo[${dto.id}].cantidad`);
  const almacenes = unwrap(
    AlmacenesPair.create(dto.almacen_origen_id, dto.almacen_destino_id),
    `combo[${dto.id}].almacenes`,
  );
  return Combo.create({ id: dto.id, nombre: dto.nombre, precioAnual, precioCorto, precioContado, cantidad, almacenes });
}

function mapVendedor(dto: VendedorV2): Vendedor {
  return Vendedor.create({
    id: dto.id,
    usuarioID: dto.usuario_id,
    email: dto.email,
    nombre: dto.nombre,
  });
}

export function imagenV2ToDomain(dto: ImagenV2): ImagenExistente {
  return Imagen.fromExistente({
    id: dto.id,
    storageKind: dto.storage_kind,
    storageKey: dto.storage_key,
    mime: dto.mime,
    sizeBytes: dto.size_bytes,
    descripcion: dto.descripcion,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdBy: dto.created_by,
    updatedBy: dto.updated_by,
  });
}

export function ventaV2ToDomain(dto: VentaV2): Venta {
  const cliente = mapCliente(dto.cliente);
  const direccion = mapDireccion(dto.direccion);
  const gps = mapGPS(dto.gps);
  const montos = mapMontos(dto.montos);
  const planCredito = dto.plan_credito !== null ? mapPlanCredito(dto.plan_credito) : null;
  const diaCobranza = dto.dia_cobranza !== null ? mapDiaCobranza(dto.dia_cobranza) : null;
  const combos = dto.combos.map(mapCombo);
  const productos = dto.productos.map(mapProducto);
  const vendedores = dto.vendedores.map(mapVendedor);
  const imagenes = dto.imagenes.map(imagenV2ToDomain);

  return Venta.create({
    id: dto.id,
    cliente,
    direccion,
    gps,
    fechaVenta: dto.fecha_venta,
    tipoVenta: dto.tipo_venta,
    estado: dto.estado,
    situacion: dto.situacion,
    sincronizacion: dto.sincronizacion,
    montos,
    planCredito,
    diaCobranza,
    nota: dto.nota,
    combos,
    productos,
    vendedores,
    imagenes,
    microsipFolio: dto.microsip_folio,
    microsipDoctoPVID: dto.microsip_docto_pv_id,
    microsipAplicadaAt: dto.microsip_aplicada_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdBy: dto.created_by,
    updatedBy: dto.updated_by,
  });
}
