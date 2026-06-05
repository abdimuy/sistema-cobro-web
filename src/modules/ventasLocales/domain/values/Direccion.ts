import { DomainError } from "../errors";

export class Direccion {
  private constructor(
    public readonly calle: string,
    public readonly numeroExterior: string | null,
    public readonly colonia: string,
    public readonly poblacion: string,
    public readonly ciudad: string,
    public readonly zonaClienteID: number | null,
  ) {}

  static create(input: {
    calle: string;
    numeroExterior: string | null;
    colonia: string;
    poblacion: string;
    ciudad: string;
    zonaClienteID: number | null;
  }): Direccion | DomainError {
    const calle = input.calle.trim();
    if (calle.length === 0) {
      return new DomainError("direccion_calle_requerida", "la calle de la dirección es obligatoria");
    }
    return new Direccion(
      calle,
      input.numeroExterior !== null ? input.numeroExterior.trim() : null,
      input.colonia.trim(),
      input.poblacion.trim(),
      input.ciudad.trim(),
      input.zonaClienteID,
    );
  }
}
