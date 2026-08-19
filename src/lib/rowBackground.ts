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
 */
export const rowBackground = (zebra: boolean, hovered: boolean): string => {
  if (hovered) return "hsl(var(--accent))";
  return zebra ? "hsl(var(--muted))" : "hsl(var(--card))";
};
