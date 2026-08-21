import type { IntentoAgrupado } from "../domain/entities";
import { etiquetaModulo, pesos } from "./formato";

// El copy de las acciones que MUTAN, en un solo lugar.
//
// Vive aparte del componente para que el diálogo y el aviso posterior no
// puedan separarse: el botón que dice "Reenviar" y el toast que dice
// "Reenviado" son el mismo verbo en dos tiempos, y editar uno sin el otro es
// exactamente como una interfaz empieza a hablar con dos voces.
export type AccionMutante = "reenviar" | "atender" | "ignorar" | "reenviar_editado";

type Copy = {
  titulo: string;
  verbo: string;
  gerundio: string;
  cuerpo: (i: IntentoAgrupado) => string;
  segundoPaso?: (i: IntentoAgrupado) => string;
};

export const COPY: Record<AccionMutante, Copy> = {
  reenviar: {
    titulo: "Reenviar al servidor",
    verbo: "Reenviar",
    gerundio: "Reenviando…",
    cuerpo: (i) =>
      `Se reenviará ${elTrabajo(i)} de ${quien(i)} por ${pesos(i.cuanto)}, tal como lo capturó el vendedor.`,
  },
  atender: {
    titulo: "Marcar como atendida",
    verbo: "Marcar atendida",
    gerundio: "Marcando…",
    cuerpo: (i) =>
      `${mayuscula(elTrabajo(i))} de ${quien(i)} por ${pesos(i.cuanto)} dejará de aparecer como pendiente. No se reenvía nada: úsalo cuando ya se resolvió por fuera.`,
  },
  ignorar: {
    titulo: "Ignorar",
    verbo: "Ignorar",
    gerundio: "Ignorando…",
    cuerpo: (i) =>
      `${mayuscula(elTrabajo(i))} de ${quien(i)} por ${pesos(i.cuanto)} se archiva sin aplicarse. El cliente no queda registrado.`,
  },
  reenviar_editado: {
    titulo: "Reenviar con los datos corregidos",
    verbo: "Reenviar",
    gerundio: "Reenviando…",
    cuerpo: (i) =>
      `Se enviará ${elTrabajo(i)} de ${quien(i)} con los datos que acabas de editar, no con los que capturó el vendedor.`,
    segundoPaso: (i) =>
      `Confirma otra vez: lo que quede registrado para ${quien(i)} será tu versión, no la del vendedor.`,
  },
};

// avisoDe es el verbo en pasado para el toast: "Reenviado", no "Operación
// completada". Vive junto al copy del diálogo para que los dos no se separen.
export function avisoDe(accion: AccionMutante): string {
  switch (accion) {
    case "reenviar":
    case "reenviar_editado":
      return "Reenviado";
    case "atender":
      return "Marcada como atendida";
    case "ignorar":
      return "Ignorada";
  }
}

function elTrabajo(i: IntentoAgrupado): string {
  return i.modulo === "pagos" ? "el pago" : "la venta";
}

function quien(i: IntentoAgrupado): string {
  return i.quien ?? `${etiquetaModulo(i.modulo).toLowerCase()} sin nombre capturado`;
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
