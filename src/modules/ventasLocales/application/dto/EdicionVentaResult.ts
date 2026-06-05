import type { Venta } from "../../domain/entities/Venta";
import type { DomainError } from "../../domain/errors";

export type PasoEdicion =
  | "cliente"
  | "header"
  | "combos"
  | "productos"
  | "eliminar_imagen"
  | "adjuntar_imagen";

export type EdicionVentaResult = {
  ventaActualizada: Venta;
  pasosExitosos: PasoEdicion[];
  errorParcial: { paso: PasoEdicion; error: DomainError } | null;
};
