import type { VentaEditPort, EliminarImagenInput } from "../ports/VentaEditPort";

export async function eliminarImagenVenta(
  deps: { port: VentaEditPort },
  input: EliminarImagenInput,
): Promise<void> {
  return deps.port.eliminarImagen(input);
}
