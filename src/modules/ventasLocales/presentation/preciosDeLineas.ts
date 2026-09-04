import type {
  ComboFormData,
  ProductoFormData,
} from "./hooks/useVentaEditState";

/**
 * Los tres niveles de precio de una venta, ya sumados.
 *
 * Son totales de la venta completa, NO precios unitarios. La distinción
 * importa: la misma palabra "contado" nombra un unitario en la tabla de
 * productos y un total en el encabezado, y confundirlos ya multiplicó por
 * ocho el precio de contado de una venta real.
 */
export type PreciosPorNivel = {
  anual: number;
  cortoPlazo: number;
  contado: number;
};

/**
 * Σ precio × cantidad para los tres niveles, con la MISMA regla que el
 * servidor aplica al guardar (`internal/ventas/domain/venta.go`,
 * `recomputarMontos`):
 *
 * - un combo suma una vez, por su precio y su cantidad;
 * - los productos que pertenecen a un combo NO suman por su cuenta — su valor
 *   ya vive en el precio del combo;
 * - las líneas marcadas como borradas no suman.
 *
 * ## Por qué es una sola función
 *
 * Esta regla estaba escrita dos veces en el escritorio —en el editor de
 * ventas locales y en el formulario de replay de intentos fallidos— y las dos
 * copias YA habían divergido: la del replay ignoraba los combos por completo,
 * aunque monta las mismas pestañas y muestra los mismos combos. Con un combo
 * de $5,000 sobre piezas de $4,500 y una silla suelta de $1,000, la venta
 * valía $6,000 y esa pantalla decía $5,500: ni el total real ni el de ninguna
 * otra regla. Duplicar esto no es barato — el número que sale de aquí es el
 * que el capturista compara contra lo que va a quedar en Microsip.
 *
 * ## Dónde MÁS vive esta regla
 *
 * Aquí no está toda. `VentaProductosTable` (la tabla del modal de detalle)
 * la implementa otra vez en su `totalDe`, porque opera sobre el DTO `VentaV2`
 * y no sobre estos tipos `*FormData`. Son dos variantes deliberadas sobre
 * formas de dato distintas, no un descuido — pero **son dos**, y con
 * `recomputarMontos` del servidor, tres. Si cambia el criterio, hay que
 * cambiar las tres.
 */
export function preciosDeLineas(
  productos: readonly ProductoFormData[],
  combos: readonly ComboFormData[],
): PreciosPorNivel {
  const sueltos = productos.filter((p) => !p.isDeleted && p.comboID === null);
  const combosActivos = combos.filter((c) => !c.isDeleted);

  const suma = (
    precioProducto: (p: ProductoFormData) => number,
    precioCombo: (c: ComboFormData) => number,
  ): number =>
    sueltos.reduce((s, p) => s + precioProducto(p) * p.cantidad, 0) +
    combosActivos.reduce((s, c) => s + precioCombo(c) * c.cantidad, 0);

  return {
    anual: suma(
      (p) => p.precioAnual,
      (c) => c.precioAnual,
    ),
    cortoPlazo: suma(
      (p) => p.precioCortoPlazo,
      (c) => c.precioCortoPlazo,
    ),
    contado: suma(
      (p) => p.precioContado,
      (c) => c.precioContado,
    ),
  };
}
