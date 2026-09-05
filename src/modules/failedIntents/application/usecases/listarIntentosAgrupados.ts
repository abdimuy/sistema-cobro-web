import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { ListInput } from "../dto";
import type { ListaAgrupadaOutput } from "../dto/ListaAgrupadaOutput";
import type { FailedIntent } from "../../domain/entities";
import { agrupar, type IntentoAgrupado } from "../../domain/entities";
import { listarIntents } from "./listarIntents";

// listarIntentosAgrupados es el caso de uso de la pantalla: pide la página,
// agrupa por trabajo y la parte en las dos colecciones que la consola muestra.
//
// Se apoya en listarIntents en vez de llamar al puerto directamente para no
// duplicar la validación del page_size —el clamp del backend vive ahí— y para
// que cualquier regla futura de la lista plana valga también aquí.
//
// Orden dentro de cada colección: el que lleva más tiempo esperando primero
// (`primero` ascendente). No por el último intento: una venta que reintenta
// cada minuto se pondría siempre al frente y la que se rindió hace dos días
// —que es la que de verdad necesita a alguien— caería al fondo.
export async function listarIntentosAgrupados(
  port: FailedIntentRepoPort,
  input: ListInput,
  signal?: AbortSignal,
): Promise<ListaAgrupadaOutput> {
  const page = await listarIntents(port, input, signal);
  return {
    ...agruparYPartir(page.items),
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  };
}

// agruparYPartir es la mitad pura del caso de uso: agrupa y parte, sin tocar
// el puerto.
//
// Está separada porque la pantalla NO puede llamar al caso de uso una vez por
// página: un grupo puede quedar a caballo entre dos páginas —tres reintentos
// en la primera y diez en la segunda— y agrupar por página diría "3 intentos"
// y luego "10" en vez de "13". La pantalla acumula las filas planas y vuelve a
// agrupar el total; el caso de uso sigue siendo la entrada de un solo tiro.
/**
 * Cómo se ordena la lista.
 *
 *  - `recientes` — lo que apareció más recientemente, primero. Es el default:
 *    la pregunta de todos los días es "¿qué se rompió hoy?", y con el orden
 *    inverso lo de hoy quedaba al final de una lista de semanas.
 *
 *    Ordena por `primero` (cuándo se vio por primera vez), NO por `ultimo`.
 *    La diferencia no es cosmética: una fila que reintenta cada minuto tiene
 *    el `ultimo` siempre fresco, así que por ahí se quedaría clavada arriba
 *    tapando todo lo demás — y encima se movería sola bajo el cursor. Es
 *    además la fecha que la tabla muestra en la columna "DESDE".
 *  - `antiguos` — lo que lleva más tiempo esperando. Sirve para vaciar la
 *    cola vieja, que era para lo que se ordenaba así antes.
 *  - `monto` — lo más caro primero, para priorizar por dinero en riesgo.
 *  - `intentos` — lo que más ha insistido, que suele ser lo más atorado.
 */
export type OrdenLista = "recientes" | "antiguos" | "monto" | "intentos";

export const ORDEN_POR_DEFECTO: OrdenLista = "recientes";

export function agruparYPartir(
  items: readonly FailedIntent[],
  orden: OrdenLista = ORDEN_POR_DEFECTO,
): Pick<ListaAgrupadaOutput, "necesitanAccion" | "seReintentan"> {
  const necesitanAccion: IntentoAgrupado[] = [];
  const seReintentan: IntentoAgrupado[] = [];
  for (const g of agrupar(items)) {
    if (g.urgencia.necesitaAccion()) necesitanAccion.push(g);
    else seReintentan.push(g);
  }
  ordenar(necesitanAccion, orden);
  ordenar(seReintentan, orden);
  return { necesitanAccion, seReintentan };
}

// ordenar aplica el criterio pedido. Todos los criterios terminan en el mismo
// desempate por clave: sin él, dos capturas del mismo segundo pueden
// intercambiarse entre renders y el renglón que alguien estaba a punto de
// tocar se mueve bajo el cursor.
function ordenar(lista: IntentoAgrupado[], orden: OrdenLista): void {
  const comparadores: Record<OrdenLista, (a: IntentoAgrupado, b: IntentoAgrupado) => number> = {
    recientes: (a, b) => b.primero.getTime() - a.primero.getTime(),
    antiguos: (a, b) => a.primero.getTime() - b.primero.getTime(),
    // Sin monto va al final, no al principio: un hueco no es lo más barato.
    monto: (a, b) => (b.cuanto ?? -1) - (a.cuanto ?? -1),
    intentos: (a, b) => b.intentos - a.intentos,
  };
  const principal = comparadores[orden];
  lista.sort((a, b) => {
    const porPrincipal = principal(a, b);
    if (porPrincipal !== 0) return porPrincipal;
    const porIntentos = b.intentos - a.intentos;
    if (porIntentos !== 0) return porIntentos;
    return a.clave.localeCompare(b.clave);
  });
}

