import { URL_API } from "../../constants/api";
import axios from "axios";

export interface ImageGarantia {
  ID: number;
  GARANTIA_ID: number;
  IMG_PATH: string;
  IMG_MIME: string;
  IMG_DESC: string | null;
}

export const getImagesByGarantia = async (
  garantiaId: number
): Promise<ImageGarantia[]> => {
  try {
    const response = await axios.get<{ body: ImageGarantia[] }>(
      `${URL_API}/garantias/imagenes/${garantiaId}`
    );
    return response.data.body;
  } catch (error) {
    console.error("Error al obtener imágenes de garantía:", error);
    throw error;
  }
};
