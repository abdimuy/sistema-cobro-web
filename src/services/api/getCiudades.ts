import axios from "axios";
import { URL_API_V2 } from "../../constants/api";
import { auth } from "../../../firebase";

// Catálogo de ciudades de Microsip (tabla CIUDADES + join a ESTADOS).
// El estado viaja SIEMPRE pegado a la ciudad: el catálogo abarca varios
// estados, y elegirlos por separado produce clientes con la ciudad de un
// estado y el estado de otro.
export interface Ciudad {
  ciudadId: number;
  ciudad: string;
  estadoId: number;
  estado: string;
}

// Forma en el cable que devuelve el backend Go (snake_case).
interface CiudadWire {
  ciudad_id: number;
  ciudad: string;
  estado_id: number;
  estado: string;
}

interface CiudadesResponse {
  items: CiudadWire[];
}

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// GET /v2/ciudades — sin parámetros, sin paginación, sólo autenticación.
// A diferencia de getZonasCliente, el error NO se traga: una lista vacía por
// un fallo de red es indistinguible de un catálogo vacío, y aquí eso deja al
// capturista sin poder elegir ciudad. El hook decide qué mostrar.
const getCiudades = async (): Promise<Ciudad[]> => {
  const headers = await authHeaders();
  const response = await axios.request<CiudadesResponse>({
    method: "GET",
    url: `${URL_API_V2}/v2/ciudades`,
    headers,
  });
  return response.data.items.map((c) => ({
    ciudadId: c.ciudad_id,
    ciudad: c.ciudad.trim(),
    estadoId: c.estado_id,
    estado: c.estado.trim(),
  }));
};

export default getCiudades;
