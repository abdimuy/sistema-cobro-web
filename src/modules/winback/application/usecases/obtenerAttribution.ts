import type { WinbackAnalyticsPort } from "../ports/WinbackAnalyticsPort";
import type { AttributionInput } from "../dto";
import type { WinbackAttribution } from "../../domain/entities";

export async function obtenerAttribution(
  port: WinbackAnalyticsPort,
  input: AttributionInput,
  signal?: AbortSignal,
): Promise<WinbackAttribution> {
  return port.obtenerAttribution(input, signal);
}
