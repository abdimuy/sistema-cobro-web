import type { AsignarZonaCajaInput, ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { ZonaCajaAsignacion } from "../../domain/entities";

// asignarZonaCaja delegates directly to the port.
export async function asignarZonaCaja(
  port: ConfiguracionPort,
  input: AsignarZonaCajaInput,
  signal?: AbortSignal,
): Promise<ZonaCajaAsignacion> {
  return port.asignarZonaCaja(input, signal);
}
