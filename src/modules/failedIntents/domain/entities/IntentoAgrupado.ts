import type { FailedIntent } from "./FailedIntent";
import { Causa } from "./Causa";
import { Urgencia } from "./Urgencia";

// IntentoAgrupado es la unidad de la pantalla: **una venta o un pago**, no un
// renglón por reintento.
//
// La diferencia no es cosmética. Medido en producción: 609 filas para 130
// ventas distintas, y una sola venta dejó 13 copias. La pantalla vieja pintaba
// las 609 —trece renglones idénticos que decían "error desconocido"— y era
// ilegible por construcción. Trece intentos de la misma venta son UN problema
// que lleva rato, y así es como se lee aquí.
//
// La agrupación vive en el dominio y no en el componente porque la clave de
// agrupación es una regla del contrato con el servidor: la `Idempotency-Key`
// identifica el trabajo, no la petición. Dos intentos con la misma clave son
// el mismo trabajo aunque sean dos filas.
//
// Nota sobre el backend: la dedup del `Save` ya colapsa los reintentos en una
// fila con `RETRY_COUNT`. Esta agrupación **igual hace falta**: el rezago que
// ya está en la tabla llegó como filas separadas, y una fila sin clave no se
// puede deduplicar del lado del servidor.

const MODULOS = ["ventas", "pagos", "otro"] as const;

export type ModuloValue = (typeof MODULOS)[number];

export type IntentoAgrupado = {
  // id del intento representativo: el MÁS RECIENTE del grupo. Es el que
  // abre el detalle y contra el que se dispara cualquier acción — su cuerpo
  // es el último que capturó el vendedor.
  readonly id: string;
  // clave de agrupación: la Idempotency-Key cuando existe, el id si no.
  readonly clave: string;
  readonly modulo: ModuloValue;
  readonly path: string;
  // quien y cuanto salen del cuerpo capturado. Son null cuando el cuerpo es
  // multipart (vive en disco, no en la fila) o no tiene forma de venta: la
  // tarjeta se degrada a mostrar el folio y el módulo en vez de inventar un
  // nombre.
  readonly quien: string | null;
  readonly cuanto: number | null;
  readonly causa: Causa;
  readonly urgencia: Urgencia;
  readonly titulo: string;
  readonly intentos: number;
  readonly primero: Date;
  readonly ultimo: Date;
  readonly estado: FailedIntent["status"];
  readonly tieneEvidencia: boolean;
};

// moduloDe deriva el módulo de la ruta capturada. No hay un campo en el
// servidor que lo diga: la ruta ES el dato.
export function moduloDe(path: string): ModuloValue {
  if (path.startsWith("/v2/ventas")) return "ventas";
  if (path.startsWith("/v2/cobranza") || path.startsWith("/v2/pagos")) return "pagos";
  return "otro";
}

// claveDe es la identidad del trabajo. La Idempotency-Key cuando el cliente la
// mandó; el id de la fila cuando no —sin clave no hay nada que agrupar, y
// juntar dos capturas distintas sería peor que mostrarlas separadas.
export function claveDe(intent: FailedIntent): string {
  const key = (intent.idempotencyKey ?? "").trim();
  return key === "" ? intent.id : key;
}

function esRegistro(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// quienDe extrae el nombre del cliente del cuerpo capturado. Lee la forma que
// POST /v2/ventas acepta (`cliente.nombre`); cualquier otra cosa devuelve null
// en vez de adivinar.
export function quienDe(body: unknown): string | null {
  if (!esRegistro(body)) return null;
  const cliente = body.cliente;
  if (!esRegistro(cliente)) return null;
  const nombre = cliente.nombre;
  if (typeof nombre !== "string") return null;
  const limpio = nombre.trim();
  return limpio === "" ? null : limpio;
}

// cuantoDe extrae el monto. Los montos viajan como CADENAS decimales a
// propósito (el contrato evita el float binario), así que aquí se parsean una
// sola vez y el número resultante es sólo para mostrar — nunca para operar.
//
// Para una venta a crédito el monto que importa es el de corto plazo o el
// anual, no el de contado; se toma el primero no-cero en ese orden, y de
// contado sólo cuando la venta es de contado.
export function cuantoDe(body: unknown): number | null {
  if (!esRegistro(body)) return null;
  const montos = body.montos;
  if (!esRegistro(montos)) return null;

  const orden =
    body.tipo_venta === "CONTADO"
      ? ["contado", "corto_plazo", "anual"]
      : ["corto_plazo", "anual", "contado"];

  for (const clave of orden) {
    const crudo = montos[clave];
    if (typeof crudo !== "string" && typeof crudo !== "number") continue;
    const n = typeof crudo === "number" ? crudo : Number.parseFloat(crudo);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// agrupar convierte una lista plana de intentos en las unidades de la
// pantalla, una por trabajo.
//
// Del grupo se conserva:
//   • el intento MÁS RECIENTE como representante (su cuerpo es el último que
//     capturó el vendedor, y es el que sirve para un reenvío),
//   • `primero` y `ultimo` como los extremos reales del grupo — es lo que
//     permite escribir "13 intentos · desde 13:20 · el último hace 4 minutos",
//   • la suma de los reintentos que el servidor ya contó (`retryCount`), no el
//     número de filas: después de la dedup del backend UNA fila puede
//     representar trece intentos.
export function agrupar(intents: readonly FailedIntent[]): IntentoAgrupado[] {
  const porClave = new Map<string, FailedIntent[]>();
  for (const intent of intents) {
    const clave = claveDe(intent);
    const grupo = porClave.get(clave);
    if (grupo) grupo.push(intent);
    else porClave.set(clave, [intent]);
  }

  const salida: IntentoAgrupado[] = [];
  for (const [clave, grupo] of porClave) {
    salida.push(desdeGrupo(clave, grupo));
  }
  return salida;
}

function desdeGrupo(clave: string, grupo: readonly FailedIntent[]): IntentoAgrupado {
  const ordenados = [...grupo].sort(
    (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime(),
  );
  const primero = ordenados[0];
  const ultimo = ordenados[ordenados.length - 1];

  const causa = Causa.desde(ultimo.errorCode, ultimo.httpStatus);

  // Cada fila representa su propia captura MÁS los reintentos que el servidor
  // colapsó en ella. Contar sólo las filas subestimaría el rezago
  // deduplicado; contar sólo retryCount perdería las capturas sueltas.
  const intentos = ordenados.reduce((total, i) => total + 1 + Math.max(0, i.retryCount), 0);

  return {
    id: ultimo.id,
    clave,
    modulo: moduloDe(ultimo.path),
    path: ultimo.path,
    quien: quienDe(ultimo.body) ?? quienDe(primero.body),
    cuanto: cuantoDe(ultimo.body) ?? cuantoDe(primero.body),
    causa,
    urgencia: Urgencia.desde(causa),
    titulo: causa.titulo(ultimo.errorMessage),
    intentos,
    primero: primero.receivedAt,
    ultimo: ultimo.receivedAt,
    estado: ultimo.status,
    tieneEvidencia: ordenados.some((i) => i.hasBlob),
  };
}
