import axios from "axios";
import { URL_API } from "../../constants/api";
import { Dayjs } from "dayjs";

export interface PagoOrVisita {
  ID: string;
  COBRADOR: string;
  COBRADOR_ID: number;
  FECHA: string;
  FORMA_COBRO_ID: number;
  IMPORTE: number;
  LAT: string;
  LNG: string;
  NOTA: string;
  TIPO_VISITA: string;
  CLIENTE: string;
  ZONA_CLIENTE_ID: number;
  CLIENTE_ID: number;
  TIPO: string;
}

const getPagosAndVisitas = async (
  zonaClienteId: number,
  dateInit: Dayjs,
  dateEnd: Dayjs
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const dateInitFormatted = dateInit
      .endOf("day")
      .format("YYYY-MM-DD HH:mm:ss");
    const dateEndFormatted = dateEnd.endOf("day").format("YYYY-MM-DD HH:mm:ss");

    axios
      .get(
        URL_API +
          "/visitas/pagos-visitas" +
          `?zonaClienteId=${zonaClienteId}&dateInit=${dateInitFormatted}&dateEnd=${dateEndFormatted}`
      )
      .then((response) => {
        resolve(response.data.body);
      })
      .catch((error) => {
        console.error(error);
        reject([]);
      });
  });
};

export default getPagosAndVisitas;
