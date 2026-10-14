import {
  Ban,
  CalendarClock,
  Circle,
  CircleCheck,
  CircleDashed,
  DoorClosed,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import type { Trato } from "../../domain/values/estadoCuenta";

export type Tono = "ok" | "teal" | "ambar" | "rojo" | "violeta" | "gris" | "ninguno";

// Cómo se pinta cada trato: color + ícono + texto, nunca color solo. Espejo de
// msp-app-kt feature/pagos/ui/EstadoCuentaUi.kt (tratoDe → contenidoDe/iconoDe);
// "escalar" es el único en sólido invertido, como en el teléfono. El trato y la
// etiqueta los manda el servidor; aquí solo se elige el pincel.
export const TRATO_META: Record<Trato, { icono: LucideIcon; tono: Tono; relleno: boolean }> = {
  pagado: { icono: CircleCheck, tono: "ok", relleno: false },
  parcial: { icono: CircleDashed, tono: "teal", relleno: false },
  regresas: { icono: RotateCcw, tono: "ambar", relleno: false },
  diferido: { icono: CalendarClock, tono: "rojo", relleno: false },
  escalar: { icono: Ban, tono: "rojo", relleno: true },
  cita: { icono: CalendarClock, tono: "violeta", relleno: false },
  nadie: { icono: DoorClosed, tono: "gris", relleno: false },
  sin_trabajar: { icono: Circle, tono: "ninguno", relleno: false },
};

export const CLASE_TONO: Record<Tono, string> = {
  ok: "bg-dsm-ok-fondo text-dsm-ok",
  teal: "bg-dsm-teal-fondo text-dsm-teal",
  ambar: "bg-dsm-ambar-fondo text-dsm-ambar",
  rojo: "bg-dsm-rojo-fondo text-dsm-rojo",
  violeta: "bg-dsm-violeta-fondo text-dsm-violeta",
  gris: "bg-dsm-gris-fondo text-dsm-gris",
  ninguno: "border border-dashed border-border bg-transparent text-foreground/80",
};

export const CLASE_RELLENO: Record<Tono, string> = {
  ok: "bg-dsm-ok text-white",
  teal: "bg-dsm-teal text-white",
  ambar: "bg-dsm-ambar text-white",
  rojo: "bg-dsm-rojo text-white",
  violeta: "bg-dsm-violeta text-white",
  gris: "bg-dsm-gris text-white",
  ninguno: "bg-foreground text-background",
};
