import type { WinbackItem } from "../../domain/entities/WinbackItem";
import { DomainError } from "../../domain/errors";
import { Segmento } from "../../domain/values/Segmento";
import { EstadoPago } from "../../domain/values/EstadoPago";
import { Tier } from "../../domain/values/Tier";
import type { WinbackItemDTO } from "../http/dtos";

export function dtoToWinbackItem(dto: WinbackItemDTO): WinbackItem {
  const fechaUltimaCompra = new Date(dto.fecha_ultima_compra);
  if (isNaN(fechaUltimaCompra.getTime())) {
    throw new DomainError(
      "fecha_ultima_compra_invalida",
      "fecha_ultima_compra no es un timestamp válido",
    );
  }

  const segmento = Segmento.create(dto.segmento);
  if (segmento instanceof DomainError) throw segmento;

  const estadoPago = EstadoPago.create(dto.estado_pago);
  if (estadoPago instanceof DomainError) throw estadoPago;

  const fechaUltimoPago = new Date(dto.fecha_ultimo_pago);
  if (isNaN(fechaUltimoPago.getTime())) {
    throw new DomainError(
      "fecha_ultimo_pago_invalida",
      "fecha_ultimo_pago no es un timestamp válido",
    );
  }

  const tier = Tier.create(dto.tier);
  if (tier instanceof DomainError) throw tier;

  return {
    clienteId: dto.cliente_id,
    nombre: dto.nombre,
    zona: dto.zona,
    telefono: dto.telefono,
    fechaUltimaCompra,
    recenciaDias: dto.recencia_dias,
    frecuencia: dto.frecuencia,
    monetary: dto.monetary,
    saldo: dto.saldo,
    porLiquidarPct: dto.por_liquidar_pct,
    nextBestProduct: dto.next_best_product,
    segmento,
    score: dto.score,
    enControl: dto.en_control,
    estadoPago,
    fechaUltimoPago,
    etiqueta: dto.etiqueta,
    resumen: dto.resumen,
    tier,
  };
}
