import type { ImagenPago } from "../../domain/entities";
import type { ImagenPagoDTO } from "../http/dtos";

export function dtoToImagenPago(dto: ImagenPagoDTO): ImagenPago {
  return {
    id: dto.id,
    mime: dto.mime,
    sizeBytes: dto.size_bytes,
    descripcion: dto.descripcion ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}
