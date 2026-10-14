// ImagenPago: foto o comprobante adjunto a un pago de la app.
export type ImagenPago = {
  readonly id: string;
  readonly mime: string;
  readonly sizeBytes: number;
  readonly descripcion: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};
