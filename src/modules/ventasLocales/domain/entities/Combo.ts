import type { Cantidad } from "../values/Cantidad";
import type { Monto } from "../values/Monto";
import type { AlmacenesPair } from "../values/AlmacenesPair";

export class Combo {
  private constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly precioAnual: Monto,
    public readonly precioCorto: Monto,
    public readonly precioContado: Monto,
    public readonly cantidad: Cantidad,
    public readonly almacenes: AlmacenesPair,
  ) {}

  static create(input: {
    id: string;
    nombre: string;
    precioAnual: Monto;
    precioCorto: Monto;
    precioContado: Monto;
    cantidad: Cantidad;
    almacenes: AlmacenesPair;
  }): Combo {
    return new Combo(
      input.id,
      input.nombre,
      input.precioAnual,
      input.precioCorto,
      input.precioContado,
      input.cantidad,
      input.almacenes,
    );
  }
}
