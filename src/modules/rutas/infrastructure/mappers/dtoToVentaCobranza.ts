import type { VentaCobranza } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { VentaCobranzaDTO } from "../http/dtos";

export function dtoToVentaCobranza(dto: VentaCobranzaDTO): VentaCobranza {
  if (typeof dto.venta_id !== "number" || !Number.isFinite(dto.venta_id) || dto.venta_id <= 0) {
    throw new DomainError(
      "venta_id_invalido",
      "venta_id debe ser un número positivo válido",
    );
  }

  if (typeof dto.cliente_id !== "number" || !Number.isFinite(dto.cliente_id) || dto.cliente_id <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "cliente_id debe ser un número positivo válido",
    );
  }

  if (typeof dto.parcialidad !== "string") {
    throw new DomainError(
      "parcialidad_invalida",
      "parcialidad debe ser una cadena",
    );
  }

  if (typeof dto.frecuencia !== "string") {
    throw new DomainError(
      "frecuencia_invalida",
      "frecuencia debe ser una cadena",
    );
  }

  if (typeof dto.abono_semana !== "string") {
    throw new DomainError(
      "abono_semana_invalido",
      "abono_semana debe ser una cadena decimal",
    );
  }

  if (typeof dto.vencidas !== "string") {
    throw new DomainError(
      "vencidas_invalido",
      "vencidas debe ser una cadena decimal",
    );
  }

  if (typeof dto.aporte !== "string") {
    throw new DomainError(
      "aporte_invalido",
      "aporte debe ser una cadena decimal",
    );
  }

  if (typeof dto.saldo !== "string") {
    throw new DomainError(
      "saldo_invalido",
      "saldo debe ser una cadena decimal",
    );
  }

  if (typeof dto.aplica_ponderado !== "boolean") {
    throw new DomainError(
      "aplica_ponderado_invalido",
      "aplica_ponderado debe ser un booleano",
    );
  }

  if (typeof dto.cliente_nombre !== "string") {
    throw new DomainError(
      "cliente_nombre_invalido",
      "cliente_nombre debe ser una cadena",
    );
  }

  if (typeof dto.folio !== "string") {
    throw new DomainError(
      "folio_invalido",
      "folio debe ser una cadena",
    );
  }

  if (typeof dto.docto_pv_id !== "number" || !Number.isFinite(dto.docto_pv_id)) {
    throw new DomainError(
      "docto_pv_id_invalido",
      "docto_pv_id debe ser un número válido",
    );
  }

  if (typeof dto.atraso_antes_cuotas !== "string") {
    throw new DomainError(
      "atraso_antes_cuotas_invalido",
      "atraso_antes_cuotas debe ser una cadena",
    );
  }

  if (typeof dto.atraso_antes_pesos !== "string") {
    throw new DomainError(
      "atraso_antes_pesos_invalido",
      "atraso_antes_pesos debe ser una cadena decimal",
    );
  }

  if (typeof dto.pago_cuotas !== "string") {
    throw new DomainError(
      "pago_cuotas_invalido",
      "pago_cuotas debe ser una cadena",
    );
  }

  if (typeof dto.atraso_despues_cuotas !== "string") {
    throw new DomainError(
      "atraso_despues_cuotas_invalido",
      "atraso_despues_cuotas debe ser una cadena",
    );
  }

  if (typeof dto.atraso_despues_pesos !== "string") {
    throw new DomainError(
      "atraso_despues_pesos_invalido",
      "atraso_despues_pesos debe ser una cadena decimal",
    );
  }

  return {
    ventaId: dto.venta_id,
    clienteId: dto.cliente_id,
    clienteNombre: dto.cliente_nombre,
    folio: dto.folio,
    doctoPvId: dto.docto_pv_id,
    parcialidad: dto.parcialidad,
    frecuencia: dto.frecuencia,
    abonoSemana: dto.abono_semana,
    vencidas: dto.vencidas,
    aporte: dto.aporte,
    saldo: dto.saldo,
    aplicaPonderado: dto.aplica_ponderado,
    atrasoAntesCuotas: dto.atraso_antes_cuotas,
    atrasoAntesPesos: dto.atraso_antes_pesos,
    pagoCuotas: dto.pago_cuotas,
    atrasoDespuesCuotas: dto.atraso_despues_cuotas,
    atrasoDespuesPesos: dto.atraso_despues_pesos,
  };
}
