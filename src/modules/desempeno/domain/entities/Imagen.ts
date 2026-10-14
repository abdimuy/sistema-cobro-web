// ImagenAdjunta: foto de un pago o de una visita (contrato §6, misma forma que
// ImagenPagoDTO del API).
export type ImagenAdjunta = {
  readonly id: string;
  readonly mime: string;
  readonly sizeBytes: number;
  readonly descripcion: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};
