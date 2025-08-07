import { URL_API } from "../../constants/api";
import axios from "axios";

export interface Evento {
  ID: string;
  GARANTIA_ID: number;
  TIPO_EVENTO: string;
  FECHA_EVENTO: string;
  COMENTARIO: string | null;
}

const getEventosByGarantia = async (garantiaId: number) => {
  const options = {
    method: "GET",
    url: `${URL_API}/garantias/${garantiaId}/eventos`,
  };

  try {
    const response = await axios.request(options);
    return response.data.body as Evento[];
  } catch (error) {
    console.error("Error fetching eventos:", error);
    return [];
  }
};

export default getEventosByGarantia;
