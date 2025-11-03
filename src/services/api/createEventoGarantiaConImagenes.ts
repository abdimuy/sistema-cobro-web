import { URL_API } from "../../constants/api";
import axios from "axios";
import { EstadoGarantiaDesktop } from "./createEventoGarantia";

export interface CreateEventoConImagenesResponse {
  evento: {
    ID: string;
    GARANTIA_ID: number;
    TIPO_EVENTO: string;
    FECHA_EVENTO: string;
    COMENTARIO: string | null;
  };
  imagenes: number;
}

const createEventoGarantiaConImagenes = async (
  garantiaId: string,
  evento: {
    id: string;
    tipoEvento: EstadoGarantiaDesktop;
    fechaEvento: string;
    comentario: string | null;
  },
  imagenes: File[]
): Promise<CreateEventoConImagenesResponse> => {
  const formData = new FormData();

  formData.append("id", evento.id);
  formData.append("tipoEvento", evento.tipoEvento);
  formData.append("fechaEvento", evento.fechaEvento);
  if (evento.comentario) {
    formData.append("comentario", evento.comentario);
  }

  imagenes.forEach((imagen) => {
    formData.append("imagenes", imagen);
  });

  const options = {
    method: "POST",
    url: `${URL_API}/garantias/${garantiaId}/eventos-con-imagenes`,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  try {
    const response = await axios.request(options);
    return response.data.body as CreateEventoConImagenesResponse;
  } catch (error) {
    console.error("Error creating evento garantia con imagenes:", error);
    throw error;
  }
};

export default createEventoGarantiaConImagenes;
