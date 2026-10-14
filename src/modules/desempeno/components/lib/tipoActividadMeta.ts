import { Banknote, DoorOpen, Percent, type LucideIcon } from "lucide-react";
import type { FormaCobro, TipoActividad } from "../../domain/entities";

export const TIPO_ACTIVIDAD_META: Record<
  TipoActividad,
  { etiqueta: string; icono: LucideIcon; claseIcono: string; clasePunto: string }
> = {
  pago: {
    etiqueta: "Pago",
    icono: Banknote,
    claseIcono: "bg-dsm-ok-fondo text-dsm-ok",
    clasePunto: "bg-dsm-ok",
  },
  visita: {
    etiqueta: "Visita",
    icono: DoorOpen,
    claseIcono: "bg-dsm-gris-fondo text-dsm-gris",
    clasePunto: "bg-dsm-visita",
  },
  condonacion: {
    etiqueta: "Condonación",
    icono: Percent,
    claseIcono: "bg-dsm-violeta-fondo text-dsm-violeta",
    clasePunto: "bg-dsm-violeta",
  },
};

// Etiqueta de una forma de cobro para pintar una Actividad. Solo las formas del
// contrato; no existe "Depósito" (spec §10). Los filtros NO usan esto: se
// arman con GET /v2/desempeno/catalogos (contrato v2 §4b).
export const FORMA_COBRO_ETIQUETA: Record<FormaCobro, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque: "Cheque",
  condonacion: "Condonación",
  otra: "Otra",
};

// Los ids del contrato son "pago:<n>" o "visita:<uuid>" (contrato §1).
export function etiquetaDeIdActividad(id: string): string {
  if (id.startsWith("pago:")) return "Pago";
  if (id.startsWith("visita:")) return "Visita";
  return "Movimiento";
}
