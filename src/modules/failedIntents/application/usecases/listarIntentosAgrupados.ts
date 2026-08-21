import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { ListInput } from "../dto";
import type { ListaAgrupadaOutput } from "../dto/ListaAgrupadaOutput";
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
  const grupos = agrupar(page.items);

  const necesitanAccion: IntentoAgrupado[] = [];
  const seReintentan: IntentoAgrupado[] = [];
  for (const g of grupos) {
    if (g.urgencia.necesitaAccion()) necesitanAccion.push(g);
    else seReintentan.push(g);
  }

  porAntiguedad(necesitanAccion);
  porAntiguedad(seReintentan);

  return {
    necesitanAccion,
    seReintentan,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  };
}

// porAntiguedad ordena in-place: primero el que lleva más tiempo esperando y,
// a igualdad de fecha, el de más intentos. El desempate por clave mantiene el
// orden estable entre renders — sin él, dos capturas del mismo segundo pueden
// intercambiarse y el renglón que alguien estaba a punto de tocar se mueve.
function porAntiguedad(lista: IntentoAgrupado[]): void {
  lista.sort((a, b) => {
    const porFecha = a.primero.getTime() - b.primero.getTime();
    if (porFecha !== 0) return porFecha;
    const porIntentos = b.intentos - a.intentos;
    if (porIntentos !== 0) return porIntentos;
    return a.clave.localeCompare(b.clave);
  });
}
