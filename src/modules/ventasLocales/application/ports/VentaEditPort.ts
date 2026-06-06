import type { Venta } from "../../domain/entities/Venta";
import type { ClienteSnapshot } from "../../domain/entities/ClienteSnapshot";
import type { Combo } from "../../domain/entities/Combo";
import type { Producto } from "../../domain/entities/Producto";
import type { Vendedor } from "../../domain/entities/Vendedor";
import type { ImagenExistente, ImagenNueva } from "../../domain/entities/Imagen";
import type { Direccion } from "../../domain/values/Direccion";
import type { GPSCoords } from "../../domain/values/GPSCoords";
import type { PlanCredito } from "../../domain/values/PlanCredito";
import type { DiaCobranza } from "../../domain/values/DiaCobranza";
import type { Monto } from "../../domain/values/Monto";

export type HeaderInput = {
  ventaID: string;
  direccion: Direccion;
  gps: GPSCoords;
  fechaVenta: string;
  montos: { anual: Monto; cortoPlazo: Monto; contado: Monto };
  planCredito: PlanCredito | null;
  diaCobranza: DiaCobranza | null;
  nota: string | null;
};

export type ClienteInput = {
  ventaID: string;
  cliente: ClienteSnapshot;
};

export type ProductosInput = {
  ventaID: string;
  productos: ReadonlyArray<Producto>;
};

export type CombosInput = {
  ventaID: string;
  combos: ReadonlyArray<Combo>;
};

export type VendedoresInput = {
  ventaID: string;
  vendedores: ReadonlyArray<Vendedor>;
};

export type AdjuntarImagenInput = {
  ventaID: string;
  imagen: ImagenNueva;
};

export type EliminarImagenInput = {
  ventaID: string;
  imagenID: string;
};

export interface VentaEditPort {
  obtenerVenta(ventaID: string): Promise<Venta>;
  actualizarHeader(input: HeaderInput): Promise<Venta>;
  actualizarCliente(input: ClienteInput): Promise<Venta>;
  reemplazarProductos(input: ProductosInput): Promise<Venta>;
  reemplazarCombos(input: CombosInput): Promise<Venta>;
  reemplazarVendedores(input: VendedoresInput): Promise<Venta>;
  adjuntarImagen(input: AdjuntarImagenInput): Promise<ImagenExistente>;
  eliminarImagen(input: EliminarImagenInput): Promise<void>;
}
