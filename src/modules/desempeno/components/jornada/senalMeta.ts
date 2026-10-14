import {
  CloudOff,
  Crosshair,
  MapPinOff,
  Pause,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import type { TipoSenal } from "../../domain/entities";

// Cómo se pinta cada señal de "Para revisar". El detalle y la regla vienen en
// español del servidor; aquí solo el título, el ícono y el color.
export const SENAL_META: Record<TipoSenal, { titulo: string; icono: LucideIcon; clase: string }> = {
  pausa_larga: { titulo: "Pausa larga", icono: Pause, clase: "bg-dsm-ambar-fondo text-dsm-ambar" },
  inicio_tarde: { titulo: "Empezó tarde", icono: Sunrise, clase: "bg-dsm-ambar-fondo text-dsm-ambar" },
  fin_temprano: { titulo: "Terminó temprano", icono: Sunset, clase: "bg-dsm-ambar-fondo text-dsm-ambar" },
  mismo_punto: { titulo: "Mismo punto", icono: Crosshair, clase: "bg-dsm-rojo-fondo text-dsm-rojo" },
  captura_tardia: {
    titulo: "Llegó tarde al servidor",
    icono: CloudOff,
    clase: "bg-dsm-gris-fondo text-dsm-gris",
  },
  sin_gps: { titulo: "Sin GPS", icono: MapPinOff, clase: "bg-dsm-gris-fondo text-dsm-gris" },
};
