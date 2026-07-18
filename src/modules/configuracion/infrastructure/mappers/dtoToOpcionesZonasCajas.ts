import type { CatalogoRef, OpcionesZonasCajas } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { CatalogoRefDTO, OpcionesZonasCajasDTO } from "../http/dtos";

function listFromDto(list: CatalogoRefDTO[] | undefined, campo: string): CatalogoRef[] {
  if (!Array.isArray(list)) {
    throw new DomainError(
      "opciones_zonas_cajas_catalogo_invalido",
      `el catálogo de ${campo} debe ser una lista`,
    );
  }
  return list.map((ref) => ({ id: ref.id, nombre: ref.nombre ?? "" }));
}

export function dtoToOpcionesZonasCajas(dto: OpcionesZonasCajasDTO): OpcionesZonasCajas {
  return {
    zonas: listFromDto(dto.zonas, "zonas"),
    cajas: listFromDto(dto.cajas, "cajas"),
    cajeros: listFromDto(dto.cajeros, "cajeros"),
    vendedores: listFromDto(dto.vendedores, "vendedores"),
    cobradores: listFromDto(dto.cobradores, "cobradores"),
  };
}
