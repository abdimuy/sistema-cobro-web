export type TipoEvento = "compra_credito" | "compra_contado" | "pago";

export interface EventoTimeline {
  fecha: Date;
  tipo: TipoEvento;
  monto: number;       // parsed from the backend string (pesos)
  etiqueta: string;
  refId: number;
}
