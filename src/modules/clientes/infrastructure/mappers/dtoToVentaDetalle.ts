import type { VentaDetalle, ContratoCredito, ProductoVenta, Pago } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { TipoVenta } from "../../domain/values/TipoVenta";
import { toCategoriaPago } from "../../domain/values/CategoriaPago";
import type { VentaDetalleDTO } from "../http/dtos";

export function dtoToVentaDetalle(dto: VentaDetalleDTO): VentaDetalle {
  // Map venta header
  const tipo = TipoVenta.create(dto.venta.tipo);
  if (tipo instanceof DomainError) throw tipo;

  const fechaVenta = new Date(dto.venta.fecha);
  if (isNaN(fechaVenta.getTime())) {
    throw new DomainError(
      "fecha_venta_invalida",
      "fecha de venta no es un timestamp válido",
    );
  }

  const venta = {
    doctoPvId: dto.venta.docto_pv_id,
    fecha: fechaVenta,
    folio: dto.venta.folio,
    tipo: tipo.value,
    total: dto.venta.total,
    saldoVenta: dto.venta.saldo_venta,
    numPagos: dto.venta.num_pagos,
  };

  // Map productos
  const productos: ProductoVenta[] = dto.productos.map((p) => ({
    articuloId: p.articulo_id,
    nombre: p.nombre,
    unidades: p.unidades,
    precioUnitario: p.precio_unitario,
    precioTotalNeto: p.precio_total_neto,
    pctjeDscto: p.pctje_dscto,
  }));

  // Map contrato. Cash sales (and old sales without a credit contract) have NO
  // contrato — the API omits the field (omitempty) so it arrives as `undefined`,
  // not `null`. Use `!= null` to catch BOTH undefined and null; otherwise
  // `dto.contrato.parcialidad` throws on contado/legacy ventas.
  const contrato: ContratoCredito | null =
    dto.contrato != null
      ? {
          parcialidad: dto.contrato.parcialidad,
          enganche: dto.contrato.enganche,
          precioDeContado: dto.contrato.precio_de_contado,
          plazoMeses: dto.contrato.plazo_meses,
          formaDePago: dto.contrato.forma_de_pago,
          vendedores: dto.contrato.vendedores,
        }
      : null;

  // Map pagos
  const pagos: Pago[] = dto.pagos.map((p) => {
    const fechaPago = new Date(p.fecha);
    if (isNaN(fechaPago.getTime())) {
      throw new DomainError(
        "fecha_pago_invalida",
        "fecha de pago no es un timestamp válido",
      );
    }
    return {
      doctoCcId: p.docto_cc_id,
      fecha: fechaPago,
      importe: p.importe,
      formaCobro: p.forma_cobro,
      conceptoCcId: p.concepto_cc_id,
      concepto: p.concepto,
      categoria: toCategoriaPago(p.categoria),
      cobrador: p.cobrador,
      esIngreso: p.es_ingreso,
    };
  });

  return { venta, productos, contrato, pagos };
}
