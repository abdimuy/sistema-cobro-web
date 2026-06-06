import type { Venta } from "../../domain/entities/Venta";
import type { ClienteSnapshot } from "../../domain/entities/ClienteSnapshot";
import type { Combo } from "../../domain/entities/Combo";
import type { Producto } from "../../domain/entities/Producto";
import type { Vendedor } from "../../domain/entities/Vendedor";
import type { ImagenNueva } from "../../domain/entities/Imagen";
import type { Direccion } from "../../domain/values/Direccion";
import type { GPSCoords } from "../../domain/values/GPSCoords";
import type { PlanCredito } from "../../domain/values/PlanCredito";
import type { DiaCobranza } from "../../domain/values/DiaCobranza";
import type { Monto } from "../../domain/values/Monto";

export type HeaderCambios = {
  direccion: Direccion;
  gps: GPSCoords;
  fechaVenta: string;
  montos: { anual: Monto; cortoPlazo: Monto; contado: Monto };
  planCredito: PlanCredito | null;
  diaCobranza: DiaCobranza | null;
  nota: string | null;
};

export type EdicionVentaInput = {
  ventaActual: Venta;
  cambios: {
    cliente?: ClienteSnapshot;
    header?: HeaderCambios;
    productos?: ReadonlyArray<Producto>;
    combos?: ReadonlyArray<Combo>;
    vendedores?: ReadonlyArray<Vendedor>;
    imagenesNuevas: ReadonlyArray<ImagenNueva>;    // empty array = none
    imagenesAEliminar: ReadonlyArray<string>;      // server IDs to delete; empty = none
  };
};
