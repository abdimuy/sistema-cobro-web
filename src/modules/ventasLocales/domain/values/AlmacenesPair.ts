import { DomainError } from "../errors";

export class AlmacenesPair {
  private constructor(
    public readonly origenID: number,
    public readonly destinoID: number,
  ) {}

  static create(origenID: number, destinoID: number): AlmacenesPair | DomainError {
    if (!Number.isInteger(origenID) || origenID <= 0 || !Number.isInteger(destinoID) || destinoID <= 0) {
      return new DomainError("almacen_invalido", "los ids de almacén deben ser enteros positivos");
    }
    if (origenID === destinoID) {
      return new DomainError("almacenes_iguales", "el almacén de origen y destino no pueden ser iguales");
    }
    return new AlmacenesPair(origenID, destinoID);
  }
}
