import type { Cliente } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { Segmento } from "../../domain/values/Segmento";
import { EstadoPago } from "../../domain/values/EstadoPago";
import type { SegmentoValue } from "../../domain/values/Segmento";
import type { EstadoPagoValue } from "../../domain/values/EstadoPago";
import type { ClienteListItemDTO } from "../http/dtos";

export function dtoToCliente(dto: ClienteListItemDTO): Cliente {
  // When tiene_pulso is false the backend sends empty strings for segmento and
  // estado_pago. Skip VO validation in that case and set both to null.
  let segmentoValue: SegmentoValue | null = null;
  let estadoPagoValue: EstadoPagoValue | null = null;

  if (dto.tiene_pulso) {
    const segmento = Segmento.create(dto.segmento);
    if (segmento instanceof DomainError) throw segmento;
    segmentoValue = segmento.value;

    const estadoPago = EstadoPago.create(dto.estado_pago);
    if (estadoPago instanceof DomainError) throw estadoPago;
    estadoPagoValue = estadoPago.value;
  }

  return {
    clienteId: dto.cliente_id,
    nombre: dto.nombre,
    zona: dto.zona,
    telefono: dto.telefono,
    direccionCorta: dto.direccion_corta,
    score: dto.score,
    segmento: segmentoValue,
    estadoPago: estadoPagoValue,
    tienePulso: dto.tiene_pulso,
    recenciaDias: dto.recencia_dias,
    saldo: dto.saldo,
  };
}
