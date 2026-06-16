import type { Cliente } from "../../domain/entities";

export type BuscarClientesOutput = {
  readonly items: Cliente[];
  readonly nextCursor: string;
};
