import type { ReporteUsuario } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { ReporteUsuarioDTO } from "../http/dtos";

export function dtoToReporteUsuario(dto: ReporteUsuarioDTO): ReporteUsuario {
  if (typeof dto.uid !== "string" || dto.uid.trim() === "") {
    throw new DomainError("uid_requerido", "uid es obligatorio");
  }

  if (typeof dto.nombre !== "string") {
    throw new DomainError("nombre_invalido", "nombre debe ser una cadena");
  }

  if (typeof dto.email !== "string") {
    throw new DomainError("email_invalido", "email debe ser una cadena");
  }

  if (
    typeof dto.cobrador_id !== "number" ||
    !Number.isFinite(dto.cobrador_id)
  ) {
    throw new DomainError(
      "cobrador_id_invalido",
      "cobrador_id debe ser un número válido",
    );
  }

  if (typeof dto.zona_id !== "number" || !Number.isFinite(dto.zona_id)) {
    throw new DomainError(
      "zona_id_invalido",
      "zona_id debe ser un número válido",
    );
  }

  if (typeof dto.zona_nombre !== "string") {
    throw new DomainError(
      "zona_nombre_invalido",
      "zona_nombre debe ser una cadena",
    );
  }

  if (
    typeof dto.num_clientes !== "number" ||
    !Number.isFinite(dto.num_clientes)
  ) {
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

  if (
    typeof dto.fecha_inicio_semana !== "string" ||
    dto.fecha_inicio_semana.trim() === ""
  ) {
    throw new DomainError(
      "fecha_inicio_semana_invalida",
      "fecha_inicio_semana es obligatoria",
    );
  }

  return {
    uid: dto.uid,
    nombre: dto.nombre,
    email: dto.email,
    cobradorId: dto.cobrador_id,
    zonaId: dto.zona_id,
    zonaNombre: dto.zona_nombre,
    numClientes: dto.num_clientes,
    saldoTotal: dto.saldo_total,
    pctCoberturaSemanal: dto.pct_cobertura_semanal ?? null,
    pctPonderadoSemanal: dto.pct_ponderado_semanal ?? null,
    coberturaNum: Number.isFinite(dto.cobertura_num) ? dto.cobertura_num : 0,
    coberturaDen: Number.isFinite(dto.cobertura_den) ? dto.cobertura_den : 0,
    ponderadoDen: Number.isFinite(dto.ponderado_den) ? dto.ponderado_den : 0,
    fechaInicioSemana: dto.fecha_inicio_semana,
  };
}
