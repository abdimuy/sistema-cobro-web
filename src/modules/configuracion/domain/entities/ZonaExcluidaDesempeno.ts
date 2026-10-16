// ZonaExcluidaDesempeno es una zona que no aparece en Desempeño de
// cobradores (D20). createdAt es RFC3339 UTC, tal cual lo manda el servidor.
export type ZonaExcluidaDesempeno = {
  readonly zonaId: number;
  readonly zonaNombre: string;
  readonly createdAt: string;
};
