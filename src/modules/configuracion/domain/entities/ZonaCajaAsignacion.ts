import type { CatalogoRef } from "./CatalogoRef";

// ZonaCajaAsignacion represents one client zone's live create-sale config:
// which caja, cajero, vendedor and cobrador apply to sales made in that
// zone. Any of the four refs can be null — "sin asignar" for that slot.
// Zones with no MSP_CFG_ZONA_CAJA row at all come back with all four null.
export type ZonaCajaAsignacion = {
  readonly zonaClienteId: number;
  readonly zonaNombre: string;
  readonly caja: CatalogoRef | null;
  readonly cajero: CatalogoRef | null;
  readonly vendedor: CatalogoRef | null;
  readonly cobrador: CatalogoRef | null;
};

// OpcionesZonasCajas bundles the 5 Microsip catalogs the screen needs to
// populate its selects (zonas is fetched for completeness/reference; the
// screen iterates zonasCajas from listarZonasCajas for its rows).
export type OpcionesZonasCajas = {
  readonly zonas: CatalogoRef[];
  readonly cajas: CatalogoRef[];
  readonly cajeros: CatalogoRef[];
  readonly vendedores: CatalogoRef[];
  readonly cobradores: CatalogoRef[];
};
