import type { BuscarVentasInput } from "../dto/BuscarVentasInput";
import type { BuscarVentasOutput } from "../dto/BuscarVentasOutput";

// VentasListPort is the outbound interface the search/list slice of
// ventasLocales requires from its host. HttpVentasListAdapter satisfies it in
// production; an in-memory fake satisfies it in use-case/hook tests.
export interface VentasListPort {
  buscarVentas(
    input: BuscarVentasInput,
    signal?: AbortSignal,
  ): Promise<BuscarVentasOutput>;
}
