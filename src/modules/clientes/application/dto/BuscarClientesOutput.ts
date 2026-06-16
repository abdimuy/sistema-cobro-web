import type { Cliente } from "../../domain/entities";

// DirectorioFacets mirrors the backend facets payload in the application layer.
// Keyed by facet name (e.g. "segmento"), each value maps a facet value to its count.
// No infra imports — this stays domain-friendly.
export type DirectorioFacets = Record<string, Record<string, number>>;

export type BuscarClientesOutput = {
  readonly items: Cliente[];
  readonly nextCursor: string;
  readonly facets: DirectorioFacets;
};
