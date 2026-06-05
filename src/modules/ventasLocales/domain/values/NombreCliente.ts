import { DomainError } from "../errors";

export class NombreCliente {
  private constructor(public readonly value: string) {}

  static create(input: string): NombreCliente | DomainError {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return new DomainError("nombre_cliente_requerido", "el nombre del cliente es obligatorio");
    }
    if (trimmed.length > 200) {
      return new DomainError("nombre_cliente_demasiado_largo", "el nombre del cliente no puede exceder 200 caracteres");
    }
    return new NombreCliente(trimmed);
  }
}
