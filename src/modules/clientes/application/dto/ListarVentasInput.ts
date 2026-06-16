export type ListarVentasInput = {
  readonly clienteId: number;
  readonly cursor?: string;
  readonly limit?: number;
};
