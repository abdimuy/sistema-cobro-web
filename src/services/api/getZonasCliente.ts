import axios from "axios";
import { URL_API_V2 } from "../../constants/api";
import { auth } from "../../../firebase";

export interface ZonaCliente {
  ZONA_CLIENTE_ID: number;
  ZONA_CLIENTE: string;
}

// Wire shape returned by the Go backend (snake_case). The public adapter
// below maps it back to the UPPER_SNAKE_CASE the rest of the app consumes,
// so the migration is invisible to every component upstream.
interface ZonaClienteWire {
  zona_cliente_id: number;
  zona_cliente: string;
}

interface ZonasResponse {
  items: ZonaClienteWire[];
}

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getZonasCliente = async (): Promise<ZonaCliente[]> => {
  try {
    const headers = await authHeaders();
    const response = await axios.request<ZonasResponse>({
      method: "GET",
      url: `${URL_API_V2}/v2/zonas-cliente`,
      headers,
    });
    return response.data.items.map((z) => ({
      ZONA_CLIENTE_ID: z.zona_cliente_id,
      ZONA_CLIENTE: z.zona_cliente,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default getZonasCliente;
