import type { VentaLocal } from "../../../../services/api/getVentasLocales";
import type { ConteoOrigen } from "../../domain/values/Coincidencia";

export type BuscarVentasOutput = {
  readonly items: VentaLocal[];
  readonly nextCursor: string;
  /** Ausente = API anterior sin conteos por origen. */
  readonly conteoOrigen?: ConteoOrigen;
};
