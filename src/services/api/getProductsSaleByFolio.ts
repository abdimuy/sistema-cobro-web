import { URL_API } from "../../constants/api";
import axios from "axios";

export interface ProductSale {
  DOCTO_PV_ID: number;
  FOLIO: string;
  DOCTO_PV_DET_ID: number;
  ARTICULO_ID: number;
  ARTICULO: string;
  CANTIDAD: number;
  PRECIO_UNITARIO_IMPTO: number;
  PRECIO_TOTAL_NETO: number;
  POSICION: number;
}

const getProductsSaleByFolio = async (
  folio: string
): Promise<ProductSale[]> => {
  const options = {
    method: "GET",
    url: `${URL_API}/ventas/product/folio/${folio}`,
  };

  try {
    const response = await axios.request(options);
    return response.data.body as ProductSale[];
  } catch (error) {
    console.error("Error fetching product sale by folio:", error);
    return [];
  }
};

export default getProductsSaleByFolio;
