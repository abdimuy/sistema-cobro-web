import type { WinbackAnalyticsPort } from "../ports/WinbackAnalyticsPort";
import type { RefrescarInput } from "../dto";
import type { RefreshResult } from "../../domain/entities";

export async function refrescarWinback(
  port: WinbackAnalyticsPort,
  input: RefrescarInput,
): Promise<RefreshResult> {
  return port.refrescar(input);
}
