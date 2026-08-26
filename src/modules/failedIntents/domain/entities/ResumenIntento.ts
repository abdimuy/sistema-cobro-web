// ResumenIntento es el dato de negocio que hace legible un renglón: **quién** y
// **cuánto**, extraídos por el servidor al capturar el intento.
//
// Existe porque ese dato no llegaba. La pantalla lo deducía del cuerpo
// capturado (`quienDe` / `cuantoDe`), y una venta lleva fotos —o sea
// multipart—, y en esa ruta el cuerpo NO viene en la fila: vive en disco del
// lado del servidor y `body` llega en `null` a propósito. Las diecinueve filas
// de ventas decían "Sin nombre capturado" por construcción, no por un defecto
// de esta pantalla.
//
// La respuesta no podía ser pedirlo por renglón. Existe
// GET /_admin/failed-intents/{id}/blob-parts, y sería tentador usarlo para
// sacar el nombre de cada tarjeta, pero eso convierte el listado —la ruta más
// caliente de la pantalla— en una petición por fila. El servidor lo extrae una
// vez, al capturar, y lo manda dentro del listado.
//
// `quienDe`/`cuantoDe` NO se borraron: siguen sirviendo a los cuerpos JSON y
// son el respaldo cuando el servidor no manda resumen —un binario viejo, una
// fila que el janitor no ha rellenado todavía—.
export type ResumenIntento = {
  // titulo es el nombre del cliente en ventas; en pagos, el del cobrador — el
  // cuerpo de un pago no trae el nombre del cliente. Null cuando el servidor
  // no pudo extraerlo: la tarjeta se degrada en vez de inventar un nombre.
  readonly titulo: string | null;
  // monto es sólo para MOSTRAR. Llega como cadena decimal desde el servidor
  // (el contrato evita el float binario) y se parsea aquí una sola vez; el
  // número resultante nunca se usa para operar.
  readonly monto: number | null;
  // referencia es el ancla para encontrar el trabajo en otro lado: el id de la
  // venta, el del cliente en un pago.
  readonly referencia: string | null;
};
