import type { VendedorAsignacion, VendedorSlot } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { VendedorAsignacionDTO, VendedorSlotDTO } from "../http/dtos";

function slotFromDto(slot: VendedorSlotDTO | null): VendedorSlot | null {
  if (slot === null) return null;
  if (typeof slot.lista_id !== "number" || !Number.isFinite(slot.lista_id)) {
    throw new DomainError(
      "vendedor_slot_lista_id_invalido",
      "lista_id del vendedor debe ser un número válido",
    );
  }
  return { listaId: slot.lista_id, nombre: slot.nombre ?? "" };
}

export function dtoToVendedorAsignacion(dto: VendedorAsignacionDTO): VendedorAsignacion {
  if (typeof dto.usuario_id !== "string" || dto.usuario_id.trim() === "") {
    throw new DomainError("usuario_id_requerido", "usuario_id es obligatorio");
  }

  return {
    usuarioId: dto.usuario_id,
    nombre: dto.nombre ?? "",
    email: dto.email ?? "",
    mapping: {
      v1: slotFromDto(dto.mapping?.v1 ?? null),
      v2: slotFromDto(dto.mapping?.v2 ?? null),
      v3: slotFromDto(dto.mapping?.v3 ?? null),
    },
    estado: dto.estado ?? "sin asignar",
  };
}
