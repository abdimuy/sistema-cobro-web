import type { PagoDetalle } from "../../domain/entities/PagoDetalle";
import { DomainError } from "../../domain/errors";
import { toCategoriaPago } from "../../domain/values/CategoriaPago";
import type { PagoDetalleDTO } from "../http/dtos";

function parseRequiredDate(raw: string, code: string, message: string): Date {
  if (!raw) {
    throw new DomainError(code, message);
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(code, message);
  }
  return d;
}

function parseOptionalDate(
  raw: string | undefined,
  code: string,
  message: string,
): Date | null {
  if (raw === undefined || raw === "") return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(code, message);
  }
  return d;
}

export function dtoToPagoDetalle(dto: PagoDetalleDTO): PagoDetalle {
  const fecha = parseRequiredDate(
    dto.fecha,
    "fecha_pago_invalida",
    "fecha de pago no es un timestamp válido",
  );

  const recibidoAt = parseOptionalDate(
    dto.recibido_at,
    "recibido_at_invalido",
    "recibido_at no es un timestamp válido",
  );

  const aplicadoAt = parseOptionalDate(
    dto.aplicado_at,
    "aplicado_at_invalido",
    "aplicado_at no es un timestamp válido",
  );

  const latRaw = dto.lat !== undefined ? Number(dto.lat) : NaN;
  const lonRaw = dto.lon !== undefined ? Number(dto.lon) : NaN;

  const origen: "app" | "microsip" =
    dto.origen === "app" ? "app" : "microsip";

  return {
    importe: dto.importe,
    iva: dto.iva,
    fecha,
    formaCobroId: dto.forma_cobro_id,
    formaCobro: dto.forma_cobro,
    referencia: dto.referencia,
    cobradorId: dto.cobrador_id,
    cobrador: dto.cobrador,
    conceptoCcId: dto.concepto_cc_id,
    concepto: dto.concepto,
    categoria: toCategoriaPago(dto.categoria),
    esIngreso: dto.es_ingreso,
    folio: dto.folio,
    lat: Number.isNaN(latRaw) ? null : latRaw,
    lon: Number.isNaN(lonRaw) ? null : lonRaw,
    aplicaACargoId: dto.aplica_a_cargo_id,
    saldoCargo: dto.saldo_cargo ?? null,
    doctoPvId: dto.docto_pv_id,
    cancelado: dto.cancelado,
    aplicado: dto.aplicado,
    recibidoAt,
    aplicadoAt,
    origen,
  };
}
