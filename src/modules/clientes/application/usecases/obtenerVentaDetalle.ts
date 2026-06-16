import type { ClientesPort } from "../ports/ClientesPort";
import type { ObtenerVentaDetalleInput } from "../dto";
import type { VentaDetalle } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

export async function obtenerVentaDetalle(
  port: ClientesPort,
  input: ObtenerVentaDetalleInput,
  signal?: AbortSignal,
): Promise<VentaDetalle> {
  if (!Number.isInteger(input.clienteId) || input.clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  if (!Number.isInteger(input.doctoPvId) || input.doctoPvId <= 0) {
    throw new DomainError(
      "docto_pv_id_invalido",
      "doctoPvId debe ser un entero positivo",
    );
  }
  return port.obtenerVentaDetalle(input, signal);
}
