import { FILTROS_ACTIVIDAD_INICIALES, type FiltrosActividad } from "../../domain/entities";
import { primerNombre } from "../lib/format";

export type VistaPredefinida = {
  id: string;
  nombre: (nombreUsuario: string) => string;
  filtros: (uid: string, actual: FiltrosActividad) => FiltrosActividad;
};

const limpio = (actual: FiltrosActividad): FiltrosActividad => ({
  ...FILTROS_ACTIVIDAD_INICIALES,
  orden: actual.orden,
  dir: actual.dir,
});

// Vistas del mock que el contrato puede servir. "Llegaron tarde" no está: el
// contrato §4 no tiene filtro por captura tardía (la marca sí llega por
// renglón y se ve en "Llegó al servidor").
export const VISTAS_PREDEFINIDAS: readonly VistaPredefinida[] = [
  { id: "todo", nombre: () => "Toda la zona", filtros: (_uid, a) => limpio(a) },
  {
    id: "usuario",
    nombre: (n) => `Solo ${primerNombre(n)}`,
    filtros: (uid, a) => ({ ...limpio(a), registradoPor: [uid] }),
  },
  { id: "sin_gps", nombre: () => "Sin GPS", filtros: (_uid, a) => ({ ...limpio(a), conGps: false }) },
  {
    id: "transferencias",
    nombre: () => "Transferencias",
    filtros: (_uid, a) => ({ ...limpio(a), tipos: ["pago"], formasCobro: ["transferencia"] }),
  },
  {
    id: "grandes",
    nombre: () => "Pagos de $400 o más",
    filtros: (_uid, a) => ({ ...limpio(a), tipos: ["pago"], montoMin: "400" }),
  },
];
