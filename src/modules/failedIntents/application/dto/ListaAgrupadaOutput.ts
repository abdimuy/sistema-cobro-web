import type { IntentoAgrupado } from "../../domain/entities";

// ListaAgrupadaOutput es lo que la pantalla consume: dos colecciones, no una
// lista con una columna de estado.
//
// La partición ES la pantalla. Arriba, lo que necesita a una persona; abajo,
// lo que se está curando solo. Quien abre la consola tiene que poder contestar
// "¿hay algo que hacer?" sin leer una tabla.
//
// Ventas y pagos van MEZCLADOS en las dos colecciones, ordenados por urgencia
// y no por módulo: el módulo es una etiqueta de cada renglón, no una pestaña.
// Separarlos obligaría a mirar dos pantallas para contestar una sola pregunta.
export type ListaAgrupadaOutput = {
  readonly necesitanAccion: ReadonlyArray<IntentoAgrupado>;
  readonly seReintentan: ReadonlyArray<IntentoAgrupado>;
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
};
