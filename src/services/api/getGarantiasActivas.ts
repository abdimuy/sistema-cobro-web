import axios from "axios";
import { URL_API } from "../../constants/api";
import { Garantia } from "../../modules/garantias/Garantias";

export interface GarantiaFilters {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  zonaClienteId?: string;
  cliente?: string;
}

const getGarantiasActivas = async (
  filters?: GarantiaFilters
): Promise<Garantia[]> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.estado) params.set("estado", filters.estado);
    if (filters.fechaInicio) params.set("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.set("fechaFin", filters.fechaFin);
    if (filters.zonaClienteId)
      params.set("zonaClienteId", filters.zonaClienteId);
    if (filters.cliente) params.set("cliente", filters.cliente);
  }

  const query = params.toString();
  const url = `${URL_API}/garantias/activa${query ? `?${query}` : ""}`;

  try {
    const response = await axios.get<{ body: Garantia[] }>(url);
    return response.data.body;
  } catch (error) {
    console.error("Error fetching garantías activas:", error);
    return [];
  }
};

export default getGarantiasActivas;
