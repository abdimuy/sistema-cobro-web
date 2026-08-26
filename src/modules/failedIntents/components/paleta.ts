/**
 * El lenguaje de color de la consola de intentos fallidos, en un solo lugar.
 *
 * ── Por qué existe ─────────────────────────────────────────────────────────
 *
 * La pantalla nació calcada del mock aprobado, y con el mock se copiaron sus
 * colores: una paleta cálida de papel (#FBF9F6 de fondo, #A33A2A de acento)
 * escrita a mano en cada componente. Se veía bien sola y desentonaba al llegar
 * navegando desde Ventas, Clientes o Cartera, que usan el sistema de la app.
 *
 * Lo que se conserva del mock es su ESTRUCTURA —las dos zonas, la rejilla, las
 * tarjetas con barra de acento, la tabla sobria de abajo, la jerarquía
 * tipográfica—, que es donde estaba su valor. El vestido es el de la app.
 *
 * ── Por qué son clases de Tailwind y no `hsl(var(--x))` ───────────────────
 *
 * En este repo `var(--card)` es CSS **inválido** y no pinta: los tokens
 * guardan sólo los tres canales HSL ("0 0% 100%"), así que hay que envolverlos
 * — `hsl(var(--card))`. Ya provocó columnas ancladas transparentes que nadie
 * notó durante días, porque compila igual.
 *
 * Usar las clases semánticas de Tailwind (`bg-card`, `text-destructive`)
 * esquiva la trampa entera: el envoltorio lo pone el propio Tailwind al
 * generar la utilidad. Sólo se escribe `hsl(var(--x))` donde no hay utilidad
 * posible —un atributo SVG, por ejemplo— y ahí hay que acordarse a mano.
 *
 * ── Por qué `destructive` es el acento ────────────────────────────────────
 *
 * El sistema de la app no tiene un token de "atención". `destructive` es el
 * rojo que ya usa para "esto necesita que lo mires", y es exactamente el
 * registro del ladrillo del mock. Elegirlo mantiene la pantalla dentro del
 * sistema en vez de abrir un token nuevo para un solo módulo.
 *
 * El acento está RESERVADO a la zona de arriba. Si algún día se usa también en
 * la tabla de abajo deja de significar "aquí hace falta una persona" y la
 * pantalla vuelve a ser una lista plana.
 */

/** Barra de acento a la izquierda de la tarjeta. */
export const ACENTO_BORDE = "border-l-destructive dark:border-l-red-400";

/**
 * Texto del acento: el veredicto del encabezado, el dato que falta.
 *
 * Lleva variante `dark:` y el botón de arriba no, y la asimetría no es un
 * descuido. `--destructive` en tema oscuro es un rojo **oscuro**
 * (`0 62.8% 30.6%`): está pensado como RELLENO, con
 * `--destructive-foreground` encima. Usado como color de TEXTO sobre una
 * superficie oscura queda casi ilegible — se vio al correr la pantalla, no al
 * compilarla.
 *
 * La forma de la variante es la que ya usa el resto de la app para acentos
 * semánticos (`text-amber-600 dark:text-amber-400` en `fasePaleta.ts`).
 */
export const ACENTO_TEXTO = "text-destructive dark:text-red-400";

/** Píldora de "13 intentos": fondo tenue del acento sobre la tarjeta. */
export const ACENTO_PILDORA =
  "bg-destructive/10 text-destructive dark:bg-red-400/15 dark:text-red-300";

/** Botón primario de la zona de acción. */
export const ACENTO_BOTON =
  "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90";

/**
 * Anillo de foco. Va con el acento y no con `--ring` porque el foco dentro de
 * esta zona tiene que leerse como parte de ella; en el resto de la pantalla se
 * usa el `focus-visible:ring-ring` de la app.
 */
export const ACENTO_FOCO =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive";

/** Superficie de una tarjeta o del panel de detalle. */
export const SUPERFICIE = "bg-card text-card-foreground";

/** Superficie de segundo nivel: tarjeta seleccionada. */
export const SUPERFICIE_2 = "bg-muted";

/**
 * La misma superficie, en hover.
 *
 * Va como constante propia y NO como `hover:${SUPERFICIE_2}`: Tailwind escanea
 * el código fuente buscando clases COMPLETAS, así que una clase compuesta en
 * tiempo de ejecución no existe en el CSS generado. Compila, pasa la revisión
 * y no pinta nada — el mismo modo de fallo que `var(--card)`.
 */
export const SUPERFICIE_2_HOVER = "hover:bg-muted";

/** Línea divisoria. */
export const LINEA = "border-border";

/** Texto secundario: rótulos, metadatos, la columna "qué pasó". */
export const TEXTO_2 = "text-muted-foreground";
