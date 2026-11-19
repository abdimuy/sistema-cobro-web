/**
 * Fondo OPACO de una fila de tabla, compartido por el <tr> y por sus celdas
 * ancladas (position: sticky).
 *
 * Una celda anclada tiene que pintar algo sólido: con `background: inherit`
 * hereda el `transparent` del <tr> y el contenido de las columnas que se
 * desplazan se ve por debajo, encabalgado con el texto. Y un color fijo tampoco
 * basta: si la fila se ilumina al pasar el mouse, la columna anclada se queda
 * apagada. Por eso el color se calcula una sola vez, con los tres estados, y se
 * aplica al <tr> y a la celda anclada.
 *
 * Los tokens van como `hsl(var(--token))` porque en este proyecto las variables
 * de `index.css` guardan sólo los canales HSL (`0 0% 100%`), no un color
 * completo: `var(--card)` a secas es una declaración inválida.
 *
 * Las filas de Archivo (solo consulta) llevan un degradado violeta propio
 * (`--archivo-fondo` hacia la tarjeta en 280px); el hover conserva el de la app.
 */
export const rowBackground = (
  zebra: boolean,
  hovered: boolean,
  archivo = false,
): string => {
  if (hovered) return "hsl(var(--accent))";
  if (archivo) return "linear-gradient(90deg, var(--archivo-fondo) 0, hsl(var(--card)) 280px)";
  return zebra ? "hsl(var(--muted))" : "hsl(var(--card))";
};
