import type { VentaLocal } from "../../../../services/api/getVentasLocales";

export type BuscarVentasOutput = {
  readonly items: VentaLocal[];
  readonly nextCursor: string;
};
