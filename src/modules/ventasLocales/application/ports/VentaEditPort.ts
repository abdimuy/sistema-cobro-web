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

// LineasInput lleva las DOS colecciones de líneas de la venta. El API las
// reemplaza en UNA sola transacción (PUT /v2/ventas/{id}/lineas) y valida las
// referencias producto→combo contra el estado final.
//
// Por qué no hay ya un `reemplazarCombos` y un `reemplazarProductos`: con dos
// peticiones, borrar un combo y crear otro con id nuevo —el rodeo que la gente
// descubrió sola para cambiar el contenido de un combo— falla en CUALQUIER
// orden. Combos primero: el combo nuevo no cubre a los productos viejos.
// Productos primero: los productos nuevos apuntan a un combo que ya no existe.
// Las dos ramas terminan en 422 producto_combo_referencia_invalida.
export type LineasInput = {
  ventaID: string;
  combos: ReadonlyArray<Combo>;    // puede ir vacío
  productos: ReadonlyArray<Producto>; // el API exige al menos uno
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
  reemplazarLineas(input: LineasInput): Promise<Venta>;
  reemplazarVendedores(input: VendedoresInput): Promise<Venta>;
  adjuntarImagen(input: AdjuntarImagenInput): Promise<ImagenExistente>;
  eliminarImagen(input: EliminarImagenInput): Promise<void>;
}
