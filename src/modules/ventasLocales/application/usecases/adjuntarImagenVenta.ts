import type { VentaEditPort, AdjuntarImagenInput } from "../ports/VentaEditPort";
import type { ImagenExistente } from "../../domain/entities/Imagen";

export async function adjuntarImagenVenta(
  deps: { port: VentaEditPort },
  input: AdjuntarImagenInput,
): Promise<ImagenExistente> {
  return deps.port.adjuntarImagen(input);
}
