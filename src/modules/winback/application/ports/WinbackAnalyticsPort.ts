import type {
  WinbackAttribution,
  RefreshResult,
} from "../../domain/entities";
import type {
  ListarWinbackInput,
  ListarWinbackOutput,
  AttributionInput,
  RefrescarInput,
} from "../dto";

// WinbackAnalyticsPort is the outbound interface the winback module requires
// from its host. The HTTP adapter satisfies it for production, and an
// in-memory fake satisfies it for the use-case tests in this directory.
export interface WinbackAnalyticsPort {
  listarItems(
    input: ListarWinbackInput,
    signal?: AbortSignal,
  ): Promise<ListarWinbackOutput>;
  obtenerAttribution(
    input: AttributionInput,
    signal?: AbortSignal,
  ): Promise<WinbackAttribution>;
  refrescar(input: RefrescarInput): Promise<RefreshResult>;
}
