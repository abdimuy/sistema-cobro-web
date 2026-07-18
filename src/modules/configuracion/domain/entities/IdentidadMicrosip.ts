// IdentidadMicrosip is a Microsip vendor identity grouped by display name.
// matchCount tells how many of the 3 attribute slots exist for that name
// (3 = complete; <3 = some slots missing, needing a manual per-slot override).
export type IdentidadMicrosip = {
  readonly nombre: string;
  readonly v1ListaId: number | null;
  readonly v2ListaId: number | null;
  readonly v3ListaId: number | null;
  readonly matchCount: number;
};
