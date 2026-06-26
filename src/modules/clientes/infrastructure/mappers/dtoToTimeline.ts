import type { EventoTimeline, TipoEvento } from "../../domain/entities/Timeline";
import type { TimelineDto } from "../http/dtos";

export function dtoToTimeline(dto: TimelineDto): EventoTimeline[] {
  if (!dto.eventos || dto.eventos.length === 0) return [];
  return dto.eventos.map((e) => ({
    fecha: new Date(e.fecha),
    tipo: e.tipo as TipoEvento,
    monto: Number(e.monto),
    etiqueta: e.etiqueta,
    refId: e.ref_id,
  }));
}
