/**
 * Conversión explícita entre **días de calendario del negocio** e **instantes**.
 *
 * Es la contraparte en el frontend de lo que el backend hace en
 * `internal/platform/firebird/tz.go` (`BusinessTZ` / `ToWallClock` /
 * `FromWallClock`): la zona vive en UNA constante, y las conversiones son
 * funciones con nombre en la frontera. Nada implícito, nada que dependa de
 * dónde esté parado el navegador.
 *
 * ## Por qué existe
 *
 * Un día de calendario y un instante NO son lo mismo, y confundirlos pierde
 * ventas de un reporte sin que nadie lo note. Medido en producción el
 * 2026-08-21: filtrar "20 ago - 20 ago" devolvía **5 ventas cuando eran 7**.
 * Las dos que faltaban se capturaron a las 18:15 y 18:18 — pasadas las 18:00
 * locales, un instante ya cae en el día UTC siguiente. El mismo corte metía de
 * contrabando las ventas de la tarde-noche del día anterior.
 *
 * ## La regla
 *
 * `docs/module-standards/DATETIME_HANDLING.md`: **anclar a la zona del
 * negocio, NUNCA a la del navegador**. Un vendedor remoto en otra zona horaria
 * tiene que ver el mismo día que el admin en CDMX.
 *
 * ## Cómo se usa
 *
 * ```ts
 * const { desde, hasta } = rangoDeDiasDeNegocio("2026-08-20", "2026-08-20");
 * // desde = "2026-08-20T06:00:00Z"   hasta = "2026-08-21T06:00:00Z"
 * ```
 */

/**
 * La zona en la que opera el negocio. Es la misma que `BusinessTZ()` del
 * backend; cambiarla aquí sin migrar datos reinterpreta toda la historia.
 */
export const ZONA_DE_NEGOCIO = "America/Mexico_City";

/**
 * Un día de calendario del negocio en formato `yyyy-MM-dd`.
 *
 * NO es un instante: "20 de agosto" no significa nada hasta que se dice en qué
 * zona. Esa es justamente la conversión que hacen las funciones de aquí abajo.
 */
export type DiaDeNegocio = string;

const FORMATO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
const MINUTO_EN_MS = 60_000;

/**
 * Offset de `zona` respecto de UTC en ese instante, en minutos (negativo al
 * oeste: CDMX hoy es -360).
 *
 * Sale de las reglas IANA vía `Intl`, no de un `-06:00` escrito a mano. Eso no
 * es purismo: México **abolió el horario de verano en octubre de 2022**, así
 * que el offset correcto de una fecha depende de cuándo sea. Un literal
 * mentiría sobre cualquier dato anterior a esa reforma — y sobre cualquier
 * cambio de reglas que venga después.
 */
export function offsetDeNegocioEnMinutos(
  instante: Date,
  zona: string = ZONA_DE_NEGOCIO,
): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instante);

  const campo = (tipo: Intl.DateTimeFormatPartTypes): number => {
    const parte = partes.find((p) => p.type === tipo);
    if (parte === undefined) {
      throw new Error(`tiempoDeNegocio: Intl no devolvió "${tipo}" para la zona ${zona}`);
    }
    return Number(parte.value);
  };

  // El reloj de pared de la zona, releído COMO SI fuera UTC. La diferencia
  // contra el instante original es exactamente el offset.
  const relojDePared = Date.UTC(
    campo("year"),
    campo("month") - 1,
    campo("day"),
    campo("hour"),
    campo("minute"),
    campo("second"),
  );
  return (relojDePared - instante.getTime()) / MINUTO_EN_MS;
}

/**
 * El instante en que empieza `dia` en `zona` — su medianoche local.
 *
 * Lanza si `dia` no es un día de calendario real. Falla fuerte a propósito:
 * interpretar mal un filtro de fechas es cómo se pierden ventas de un reporte
 * sin que nadie lo note.
 */
export function inicioDelDiaDeNegocio(
  dia: DiaDeNegocio,
  zona: string = ZONA_DE_NEGOCIO,
): Date {
  const { anio, mes, diaDelMes } = partirDia(dia);

  // Medianoche "como si fuera UTC"; después se corrige por el offset real.
  const medianocheComoUTC = Date.UTC(anio, mes - 1, diaDelMes);

  // Dos pasadas: el offset se evalúa en el instante candidato, no en el
  // supuesto. Con una sola pasada, un día que cruza un cambio de reglas
  // horarias queda desplazado una hora.
  const primerOffset = offsetDeNegocioEnMinutos(new Date(medianocheComoUTC), zona);
  const candidato = medianocheComoUTC - primerOffset * MINUTO_EN_MS;
  const segundoOffset = offsetDeNegocioEnMinutos(new Date(candidato), zona);
  if (segundoOffset === primerOffset) {
    return new Date(candidato);
  }
  return new Date(medianocheComoUTC - segundoOffset * MINUTO_EN_MS);
}

/**
 * El par `[desde, hasta)` en RFC3339 UTC que cubre los días de negocio
 * `primerDia..ultimoDia` **completos**, ambos incluidos.
 *
 * `hasta` es el inicio del día SIGUIENTE al último porque el API es exclusivo
 * en esa cota (`FECHA_VENTA < hasta`): así el último día entra entero.
 */
export function rangoDeDiasDeNegocio(
  primerDia: DiaDeNegocio,
  ultimoDia: DiaDeNegocio,
  zona: string = ZONA_DE_NEGOCIO,
): { desde: string; hasta: string } {
  if (primerDia > ultimoDia) {
    // Comparación lexicográfica: con `yyyy-MM-dd` equivale a la cronológica.
    throw new Error(
      `tiempoDeNegocio: rango invertido (${primerDia} > ${ultimoDia}); ` +
        "devolver vacío en silencio escondería el error",
    );
  }
  return {
    desde: enRFC3339(inicioDelDiaDeNegocio(primerDia, zona)),
    hasta: enRFC3339(inicioDelDiaDeNegocio(diaSiguiente(ultimoDia), zona)),
  };
}

/** Valida y parte `yyyy-MM-dd`. Lanza si no es un día real del calendario. */
function partirDia(dia: DiaDeNegocio): { anio: number; mes: number; diaDelMes: number } {
  const coincidencia = FORMATO_DIA.exec(dia);
  if (coincidencia === null) {
    throw new Error(`tiempoDeNegocio: "${dia}" no es un día yyyy-MM-dd`);
  }
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const diaDelMes = Number(coincidencia[3]);

  // El formato puede ser correcto y el día no existir (2026-13-01, 2026-02-30).
  // Date.UTC normaliza en silencio, así que se comprueba el viaje redondo.
  const normalizado = new Date(Date.UTC(anio, mes - 1, diaDelMes));
  if (
    normalizado.getUTCFullYear() !== anio ||
    normalizado.getUTCMonth() !== mes - 1 ||
    normalizado.getUTCDate() !== diaDelMes
  ) {
    throw new Error(`tiempoDeNegocio: "${dia}" no existe en el calendario`);
  }
  return { anio, mes, diaDelMes };
}

/**
 * El día de calendario siguiente. Se avanza sobre el CALENDARIO, no sumando 24
 * horas a un instante: sumar horas se rompe justo en los días que cambian de
 * offset, que son los que este módulo existe para manejar bien.
 */
function diaSiguiente(dia: DiaDeNegocio): DiaDeNegocio {
  const { anio, mes, diaDelMes } = partirDia(dia);
  const siguiente = new Date(Date.UTC(anio, mes - 1, diaDelMes + 1));
  return siguiente.toISOString().slice(0, 10);
}

/** RFC3339 UTC sin milisegundos, que es lo que el API acepta. */
function enRFC3339(instante: Date): string {
  return instante.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Un reloj de pared del negocio en el formato que exige `<input
 * type="datetime-local">`: `yyyy-MM-ddTHH:mm`, **sin zona**.
 *
 * Es lo mismo que `DiaDeNegocio` un nivel más fino: tampoco significa nada
 * hasta que se dice en qué zona se lee.
 */
export type RelojDeNegocio = string;

// Anclado en los dos extremos a propósito. Sin el `$`, cualquier cosa pegada
// después del minuto se descartaba en silencio y `desdeRelojDeNegocio`
// devolvía un instante como si la entrada estuviera bien.
// El año va `\d{4,}` y no `\d{4}`: un `datetime-local` de Chromium admite
// hasta el año 275760, y exigir cuatro dígitos exactos hacía lanzar a
// `desdeRelojDeNegocio` dentro del onChange — donde un throw no lo recoge
// ningún ErrorBoundary, se escapa a `window` y la pulsación se pierde.
const FORMATO_RELOJ = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

/**
 * RFC3339 con designador de zona obligatorio.
 *
 * `new Date()` acepta mucho más que esto, y varias de esas formas las
 * interpreta **en la zona del navegador** — que es justo lo que este módulo
 * existe para no hacer. Medido antes de anclar el formato:
 *
 * ```
 * enRelojDeNegocio("06/06/2026 10:00") // "2026-06-06T10:00" con TZ=UTC,
 *                                      // "2026-06-06T05:00" en México
 * enRelojDeNegocio("2026-09-01")       // "2026-08-31T18:00": un día antes
 * ```
 *
 * Comprobar sólo `Number.isNaN(getTime())` dejaba pasar las dos.
 */
const FORMATO_INSTANTE =
  /^\+?\d{4,}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * El instante `instanteISO` leído como reloj de pared del negocio, listo para
 * el `value` de un `<input type="datetime-local">`.
 *
 * ```ts
 * enRelojDeNegocio("2026-09-02T00:38:00Z") // "2026-09-01T18:38"
 * ```
 *
 * NO es `instanteISO.slice(0, 16)`. Ese recorte mete el reloj UTC en un
 * control que no tiene zona: la venta de las 18:38 se mostraba como las 00:38
 * del día siguiente. Y como el control reescribe lo que muestra, "corregir"
 * ese día retrocedía la venta 24 horas.
 */
export function enRelojDeNegocio(
  instanteISO: string,
  zona: string = ZONA_DE_NEGOCIO,
): RelojDeNegocio {
  if (!FORMATO_INSTANTE.test(instanteISO)) {
    throw new Error(`tiempoDeNegocio: "${instanteISO}" no es un instante RFC3339`);
  }
  const instante = new Date(instanteISO);
  if (Number.isNaN(instante.getTime())) {
    // El formato puede ser correcto y el instante no existir (2026-13-45).
    throw new Error(`tiempoDeNegocio: "${instanteISO}" no existe en el calendario`);
  }
  const offset = offsetDeNegocioEnMinutos(instante, zona);
  const relojDePared = new Date(instante.getTime() + offset * MINUTO_EN_MS);
  return formatearRelojUTC(relojDePared);
}

/**
 * `Date` → `yyyy-MM-ddTHH:mm` leyendo sus campos UTC.
 *
 * NO es `toISOString().slice(0, 16)`. En cuanto el año pasa de cuatro dígitos,
 * `toISOString()` cambia a la forma EXPANDIDA de ISO 8601
 * (`"+010000-01-01T10:00:00.000Z"`) y ese recorte devuelve
 * `"+010000-01-01T10"`: con el signo delante y sin los minutos. Cortar cadenas
 * por índice es exactamente el error que este módulo existe para no cometer.
 */
function formatearRelojUTC(instante: Date): RelojDeNegocio {
  const dosDigitos = (n: number): string => String(n).padStart(2, "0");
  return (
    String(instante.getUTCFullYear()).padStart(4, "0") +
    `-${dosDigitos(instante.getUTCMonth() + 1)}` +
    `-${dosDigitos(instante.getUTCDate())}` +
    `T${dosDigitos(instante.getUTCHours())}` +
    `:${dosDigitos(instante.getUTCMinutes())}`
  );
}

/**
 * El instante RFC3339 UTC en que ocurre `reloj` en la zona del negocio — la
 * inversa exacta de `enRelojDeNegocio`.
 *
 * ```ts
 * desdeRelojDeNegocio("2026-09-01T18:38") // "2026-09-02T00:38:00Z"
 * ```
 *
 * NO es `` `${reloj}:00.000Z` ``. Estampar la Z encima del reloj local declara
 * que las 18:38 de México fueron las 18:38 UTC — seis horas antes de la venta.
 */
export function desdeRelojDeNegocio(
  reloj: RelojDeNegocio,
  zona: string = ZONA_DE_NEGOCIO,
): string {
  const coincidencia = FORMATO_RELOJ.exec(reloj);
  if (coincidencia === null) {
    throw new Error(`tiempoDeNegocio: "${reloj}" no es un reloj yyyy-MM-ddTHH:mm`);
  }
  const [, anio, mes, diaDelMes, hora, minuto] = coincidencia.map(Number);

  // El formato puede ser correcto y el reloj no existir (2026-02-30T10:00), o
  // caer fuera del rango representable. `Date.UTC` normaliza en silencio, así
  // que se comprueba el viaje redondo. No se reusa `partirDia` porque aquél
  // exige un año de exactamente cuatro dígitos.
  const relojComoUTC = Date.UTC(anio, mes - 1, diaDelMes, hora, minuto);
  const normalizado = new Date(relojComoUTC);
  if (
    normalizado.getUTCFullYear() !== anio ||
    normalizado.getUTCMonth() !== mes - 1 ||
    normalizado.getUTCDate() !== diaDelMes ||
    normalizado.getUTCHours() !== hora ||
    normalizado.getUTCMinutes() !== minuto
  ) {
    throw new Error(`tiempoDeNegocio: "${reloj}" no existe en el calendario`);
  }

  // Mismo baile de dos pasadas que `inicioDelDiaDeNegocio`: el offset se
  // evalúa en el instante candidato, no en el supuesto.
  const primerOffset = offsetDeNegocioEnMinutos(new Date(relojComoUTC), zona);
  const candidato = relojComoUTC - primerOffset * MINUTO_EN_MS;
  const segundoOffset = offsetDeNegocioEnMinutos(new Date(candidato), zona);
  if (segundoOffset === primerOffset) {
    return enRFC3339(new Date(candidato));
  }
  return enRFC3339(new Date(relojComoUTC - segundoOffset * MINUTO_EN_MS));
}

/**
 * `enRelojDeNegocio` para pintar un campo cuyo valor **puede venir roto**:
 * devuelve `""` en vez de lanzar.
 *
 * ## Cuándo usar cuál
 *
 * La versión estricta es la de por defecto: en la mayoría del código un
 * instante ilegible es un defecto, y lanzar lo pone donde se ve. Esta variante
 * es para la frontera contraria — pintar un `value` a partir de un dato que
 * llegó de fuera y del que ya se sabe que puede estar mal.
 *
 * El caso concreto: `VentaReplayForm` edita cuerpos que el servidor
 * **rechazó**, y su guardia estructural `isVentaShapedBody` sólo exige que
 * `fecha_venta` sea un string. No valida el valor a propósito — su comentario
 * dice que "ése es el trabajo del formulario, que los muestra como errores por
 * campo para que el operador los corrija". Con la versión estricta, la
 * pantalla que existe para arreglar esos cuerpos se caía al abrirlos: el throw
 * ocurría en render y en `src/` no hay ni un `ErrorBoundary`, así que se
 * llevaba la aplicación entera y no sólo el modal.
 *
 * Un campo vacío que el operador rellena es el modo de fallo correcto. Es
 * también el que tenía el `slice(0, 16)` de antes, que con `""` devolvía `""`.
 */
export function relojDeNegocioSeguro(
  instanteISO: string,
  zona: string = ZONA_DE_NEGOCIO,
): RelojDeNegocio {
  try {
    return enRelojDeNegocio(instanteISO, zona);
  } catch {
    return "";
  }
}
