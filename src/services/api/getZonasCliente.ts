import axios from "axios";
import { URL_API } from "../../constants/api";

export interface ZONA_CLIENTE {
  ZONA_CLIENTE_ID: number;
  ZONA_CLIENTE: string;
}

const options = {
  method: "GET",
  url: URL_API + "/zonas-cliente",
};

const getZonasCliente = async (): Promise<ZONA_CLIENTE[]> => {
  try {
    const response = await axios.request(options);
    return response.data.body;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default getZonasCliente;
