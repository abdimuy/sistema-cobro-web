import type { ClientesPort } from "../ports/ClientesPort";
import type { ObtenerPagoDetalleInput } from "../dto";
import type { PagoDetalle } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

export async function obtenerPagoDetalle(
  port: ClientesPort,
  input: ObtenerPagoDetalleInput,
  signal?: AbortSignal,
): Promise<PagoDetalle> {
  if (!Number.isInteger(input.clienteId) || input.clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  if (!Number.isInteger(input.doctoCcId) || input.doctoCcId <= 0) {
    throw new DomainError(
      "docto_cc_id_invalido",
      "doctoCcId debe ser un entero positivo",
    );
  }
  return port.obtenerPagoDetalle(input, signal);
}
