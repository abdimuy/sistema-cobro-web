import { ventaV2Http, VentaV2 } from "./ventaV2Types";

export const regresarBorradorVenta = async (id: string): Promise<VentaV2> => {
  const res = await ventaV2Http.post<VentaV2>(`/ventas/${id}/regresar-borrador`);
  return res.data;
};
