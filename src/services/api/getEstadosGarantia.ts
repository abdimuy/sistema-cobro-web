import axios from "axios";
import { URL_API } from "../../constants/api";

export interface EstadoGarantia {
  value: string;
  label: string;
}

const getEstadosGarantia = async (): Promise<EstadoGarantia[]> => {
  try {
    const response = await axios.get<{ body: EstadoGarantia[] }>(
      `${URL_API}/garantias/estados`
    );
    return response.data.body;
  } catch (error) {
    console.error("Error fetching estados de garantía:", error);
    return [];
  }
};

export default getEstadosGarantia;
