import type { Actividad } from "../../domain/entities";

export type CategoriaPunto = "pago" | "visita" | "no_pago" | "otro";

// Sólo mapea campos que ya manda el servidor a un color; no decide nada nuevo.
// - tipo "pago"            -> pago
// - visita, trato (v2)     -> "pagado"/"parcial" = pago; "escalar" = no pagó;
//                             el resto (incl. "nadie", No estaba) = visita sin pago
// - condonación            -> otro (neutro)
export function categoriaDePunto(a: Pick<Actividad, "tipo" | "visita">): CategoriaPunto {
  if (a.tipo === "pago") return "pago";
  if (a.tipo === "visita") {
    const trato = a.visita?.trato;
    if (trato === "pagado" || trato === "parcial") return "pago";
    if (trato === "escalar") return "no_pago";
    return "visita";
  }
  return "otro";
}

// Variable de color del tema (index.css) por categoría.
export const VARIABLE_COLOR: Record<CategoriaPunto | "marca", string> = {
  pago: "--dsm-ok",
  visita: "--dsm-ambar",
  no_pago: "--dsm-rojo",
  otro: "--dsm-gris",
  marca: "--dsm-marca",
};

export const CLASE_COLOR: Record<CategoriaPunto | "marca", string> = {
  pago: "bg-dsm-ok",
  visita: "bg-dsm-ambar",
  no_pago: "bg-dsm-rojo",
  otro: "bg-dsm-gris",
  marca: "bg-dsm-marca",
};

export const ETIQUETA_CATEGORIA: Record<CategoriaPunto, string> = {
  pago: "Pagó",
  visita: "Visita",
  no_pago: "No pagó",
  otro: "Otro",
};
