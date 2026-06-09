import type { VentaEventosPort } from "../../application/ports/VentaEventosPort";
import type { VentaEvento } from "../../domain/entities/VentaEvento";
import { apiClient } from "./apiClient";
import { mapAxiosError } from "../mappers/errorMapper";

interface VentaEventoDTO {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  actor_id?: string;
  actor_nombre?: string;
}

interface VentaEventosResponseDTO {
  items: VentaEventoDTO[];
}

function dtoToEvento(dto: VentaEventoDTO): VentaEvento {
  return {
    id: dto.id,
    eventType: dto.event_type,
    payload: dto.payload,
    occurredAt: new Date(dto.occurred_at),
    actorNombre: dto.actor_nombre ?? "",
  };
}

export class HttpVentaEventosAdapter implements VentaEventosPort {
  async obtenerEventos(ventaID: string, signal?: AbortSignal): Promise<VentaEvento[]> {
    try {
      const res = await apiClient.get<VentaEventosResponseDTO>(
        `/ventas/${ventaID}/eventos`,
        { signal },
      );
      return res.data.items.map(dtoToEvento);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }
}
