import axios from "axios";
import { URL_API } from "../../constants/api";

export interface Ruta {
  COBRADOR_ID: number;
  COBRADOR: string;
}

const options = {
  method: "GET",
  url: URL_API + "/rutas",
};

const getRutas = async (): Promise<Ruta[]> => {
  try {
    const response = await axios.request(options);
    return response.data.body;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default getRutas;
