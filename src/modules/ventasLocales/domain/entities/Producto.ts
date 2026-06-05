import type { Cantidad } from "../values/Cantidad";
import type { Monto } from "../values/Monto";
import type { AlmacenesPair } from "../values/AlmacenesPair";
import { DomainError } from "../errors";

export class Producto {
  private constructor(
    public readonly id: string,
    public readonly articuloID: number,
    public readonly articulo: string,
    public readonly cantidad: Cantidad,
    public readonly precioAnual: Monto,
    public readonly precioCorto: Monto,
    public readonly precioContado: Monto,
    public readonly comboID: string | null,
    public readonly almacenes: AlmacenesPair | null,
  ) {}

  static create(input: {
    id: string;
    articuloID: number;
    articulo: string;
    cantidad: Cantidad;
    precioAnual: Monto;
    precioCorto: Monto;
    precioContado: Monto;
    comboID: string | null;
    almacenes: AlmacenesPair | null;
  }): Producto | DomainError {
    // Invariant: exactly one of comboID or almacenes must be set
    const hasCombo = input.comboID !== null;
    const hasAlmacenes = input.almacenes !== null;
    if (hasCombo === hasAlmacenes) {
      return new DomainError(
        "producto_combo_xor_almacenes_invalido",
        "el producto debe tener combo o almacenes, no ambos ni ninguno",
      );
    }
    return new Producto(
      input.id,
      input.articuloID,
      input.articulo,
      input.cantidad,
      input.precioAnual,
      input.precioCorto,
      input.precioContado,
      input.comboID,
      input.almacenes,
    );
  }
}
