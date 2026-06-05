import { ventaV2Http, VentaV2 } from "./ventaV2Types";

export const aplicarVenta = async (id: string): Promise<VentaV2> => {
  const res = await ventaV2Http.post<VentaV2>(`/ventas/${id}/aplicar`);
  return res.data;
};
