import type { Ruta } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { RutaResumenDTO } from "../http/dtos";

export function dtoToRuta(dto: RutaResumenDTO): Ruta {
  if (typeof dto.zona_id !== "number" || !Number.isFinite(dto.zona_id)) {
    throw new DomainError(
      "zona_id_invalido",
      "zona_id debe ser un número válido",
    );
  }

  if (typeof dto.zona_nombre !== "string" || dto.zona_nombre.trim() === "") {
    throw new DomainError(
      "zona_nombre_requerido",
      "zona_nombre es obligatorio",
    );
  }

  if (typeof dto.num_clientes !== "number" || !Number.isFinite(dto.num_clientes)) {
    throw new DomainError(
      "num_clientes_invalido",
      "num_clientes debe ser un número válido",
    );
  }

  if (typeof dto.saldo_total !== "string") {
    throw new DomainError(
      "saldo_total_invalido",
      "saldo_total debe ser una cadena decimal",
    );
  }

  return {
    zonaId: dto.zona_id,
    zonaNombre: dto.zona_nombre,
    cobradorNombre: dto.cobrador_nombre ?? "",
    numClientes: dto.num_clientes,
    saldoTotal: dto.saldo_total,
  };
}
