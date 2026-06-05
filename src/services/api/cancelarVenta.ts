import { ventaV2Http, VentaV2 } from "./ventaV2Types";

export const cancelarVenta = async (id: string, reason: string): Promise<VentaV2> => {
  const res = await ventaV2Http.patch<VentaV2>(`/ventas/${id}/cancel`, { reason });
  return res.data;
};
