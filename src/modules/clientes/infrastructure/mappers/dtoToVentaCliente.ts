import type { VentaCliente } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { TipoVenta } from "../../domain/values/TipoVenta";
import type { VentaListItemDTO } from "../http/dtos";

export function dtoToVentaCliente(dto: VentaListItemDTO): VentaCliente {
  const tipo = TipoVenta.create(dto.tipo);
  if (tipo instanceof DomainError) throw tipo;

  const fecha = new Date(dto.fecha);
  if (isNaN(fecha.getTime())) {
    throw new DomainError(
      "fecha_venta_invalida",
      "fecha de venta no es un timestamp válido",
    );
  }

  return {
    doctoPvId: dto.docto_pv_id,
    fecha,
    folio: dto.folio,
    tipo: tipo.value,
    total: dto.total,
    saldoVenta: dto.saldo_venta,
    numPagos: dto.num_pagos,
    hora: dto.hora,
    almacen: dto.almacen,
    primerArticulo: dto.primer_articulo,
    numArticulos: dto.num_articulos,
  };
}
