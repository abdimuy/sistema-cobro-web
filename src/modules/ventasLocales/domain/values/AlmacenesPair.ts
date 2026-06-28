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
    // origen == destino es válido: el origen es la camioneta del cobrador y el
    // destino siempre es el almacén de exhibición configurado; pueden coincidir.
    // El backend dejó de rechazarlo (commit ba1ac30) y el frontend debe aceptarlo
    // para no romper la edición de ventas con productos así.
    return new AlmacenesPair(origenID, destinoID);
  }
}
