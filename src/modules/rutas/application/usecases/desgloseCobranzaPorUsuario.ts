import type { DesgloseCobranza, RutasPort } from "../ports/RutasPort";

export async function desgloseCobranzaPorUsuario(
  port: RutasPort,
  uid: string,
  signal?: AbortSignal,
): Promise<DesgloseCobranza> {
  return port.desgloseCobranzaPorUsuario(uid, signal);
}
