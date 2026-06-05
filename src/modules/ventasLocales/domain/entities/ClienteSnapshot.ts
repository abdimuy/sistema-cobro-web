import type { NombreCliente } from "../values/NombreCliente";
import type { Telefono } from "../values/Telefono";

const REFERENCIA_MAX_LEN = 99;

export class ClienteSnapshot {
  private constructor(
    public readonly clienteID: number | null,
    public readonly nombre: NombreCliente,
    public readonly telefono: Telefono | null,
    public readonly aval: string | null,
    public readonly referencia: string | null,
  ) {}

  static create(input: {
    clienteID: number | null;
    nombre: NombreCliente;
    telefono: Telefono | null;
    aval: string | null;
    referencia: string | null;
  }): ClienteSnapshot {
    const aval = input.aval !== null ? input.aval.trim() : null;
    let referencia = input.referencia !== null ? input.referencia.trim() : null;
    // Silently truncate referencia to max length — caller may pass raw backend data
    if (referencia !== null && referencia.length > REFERENCIA_MAX_LEN) {
      referencia = referencia.slice(0, REFERENCIA_MAX_LEN);
    }
    return new ClienteSnapshot(input.clienteID, input.nombre, input.telefono, aval, referencia);
  }
}
