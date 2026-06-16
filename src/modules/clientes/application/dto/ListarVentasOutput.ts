import type { VentaCliente } from "../../domain/entities";

export type ListarVentasOutput = {
  readonly items: VentaCliente[];
  readonly nextCursor: string;
};
