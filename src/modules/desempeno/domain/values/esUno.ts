// esUno comprueba que un valor desconocido pertenezca a un catálogo cerrado
// de cadenas. Lo usan los mappers para rechazar códigos que el contrato no
// conoce, en vez de dejarlos pasar como si fueran válidos.
export function esUno<T extends string>(
  catalogo: readonly T[],
  valor: unknown,
): valor is T {
  return typeof valor === "string" && (catalogo as readonly string[]).includes(valor);
}
