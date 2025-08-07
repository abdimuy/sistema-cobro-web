import { URL_API } from "../../constants/api";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const AllowedEstados = [
  "NOTIFICADO",
  "RECOLECTADO",
  "RECIBIDO",
  "LEVANTAMIENTO_REPORTE",
  "EN_PROCESO_REPARACION",
  "NO_APLICABLE",
  "APLICABLE",
  "LISTO_PARA_ENTREGAR",
  "ENTREGADO",
  "CIERRE_GARANTIA",
  "CANCELADO",
] as const;

export const AllowedEstadosDesktop = [
  "RECIBIDO",
  "LEVANTAMIENTO_REPORTE",
  "EN_PROCESO_REPARACION",
  "APLICABLE",
  "NO_APLICABLE",
  "LISTO_PARA_ENTREGAR",
  "CIERRE_GARANTIA",
  "CANCELADO",
] as const;

export type EstadoGarantiaDesktop = (typeof AllowedEstadosDesktop)[number];

export interface CreateEventoGarantia {
  tipoEvento: EstadoGarantiaDesktop;
  fechaEvento: string;
  comentario: string | null;
  id: string;
}

const createEventoGarantia = async (
  garantiaId: string,
  evento: Omit<CreateEventoGarantia, "id">
): Promise<CreateEventoGarantia> => {
  console.log({ garantiaId });
  const id = uuidv4(); // Generamos un UUID para el evento
  const options = {
    method: "POST",
    url: `${URL_API}/garantias/${garantiaId}/eventos`,
    data: {
      tipoEvento: evento.tipoEvento,
      fechaEvento: evento.fechaEvento,
      comentario: evento.comentario,
      id,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data.body as CreateEventoGarantia;
  } catch (error) {
    console.error("Error creating evento garantia:", error);
    throw error;
  }
};

export default createEventoGarantia;
