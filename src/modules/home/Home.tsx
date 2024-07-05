import React from "react";
import Map from "../../components/Map";
import useGetPagos, { Pago } from "../../hooks/useGetPagos";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { ZONA_CLIENTE } from "../../services/api/getZonasCliente";
import useGetZonasCliente from "../user/useGetZonaCliente";
import useGetVenta from "../../hooks/useGetVenta";
import {
  CONDONACION_ID,
  PAGO_CON_TRANSFERENCIA_ID,
  PAGO_EN_EFECTIVO_ID,
} from "../../constants/values";
import useGetVisitas, { Visita } from "../../hooks/useGetVisitas";
import useGetVentaByCliente from "../../hooks/useGetVentaByCliente";

const Home = () => {
  const [point, setPoint] = React.useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [fechaInicio, setFechaInicio] = React.useState(dayjs().startOf("day"));
  const [fechaFin, setFechaFin] = React.useState(dayjs().endOf("day"));
  const [zonaCliente, setZonaCliente] = React.useState<ZONA_CLIENTE>({
    ZONA_CLIENTE_ID: 0,
    ZONA_CLIENTE: "",
  });
  const [visitasOrPagos, setVisitasOrPagos] = React.useState<
    "visitas" | "pagos"
  >("pagos");
  const { zonasCliente } = useGetZonasCliente();

  const { pagos, isLoading: loadingPagos } = useGetPagos(
    zonaCliente.ZONA_CLIENTE_ID,
    fechaInicio,
    fechaFin
  );
  const { isLoading: visitasLoading, visitas } = useGetVisitas(
    zonaCliente.ZONA_CLIENTE_ID,
    fechaInicio,
    fechaFin
  );

  const totalPagos = pagos.reduce((acc, pago) => {
    if (
      [PAGO_CON_TRANSFERENCIA_ID, PAGO_EN_EFECTIVO_ID].includes(
        pago.FORMA_COBRO_ID
      )
    ) {
      return acc + pago.IMPORTE;
    }
    return acc;
  }, 0);
  const totalCondonaciones = pagos.reduce((acc, pago) => {
    if (pago.FORMA_COBRO_ID === CONDONACION_ID) {
      return acc + pago.IMPORTE;
    }
    return acc;
  }, 0);

  const numPagos = pagos.filter((pago) =>
    [PAGO_CON_TRANSFERENCIA_ID, PAGO_EN_EFECTIVO_ID].includes(
      pago.FORMA_COBRO_ID
    )
  ).length;
  const numCondonaciones = pagos.filter(
    (pago) => pago.FORMA_COBRO_ID === CONDONACION_ID
  ).length;

  return (
    <div className="w-full h-full flex justify-center bg-white">
      <div className="grid grid-cols-[40rem,1fr] grid-rows-[5rem,2rem,4rem] w-full overflow-auto">
        <h1 className="col-span-2 text-black text-4xl text-center font-bold mb-4 mt-4">
          {visitasOrPagos === "visitas" ? "Visitas" : "Pagos"}
        </h1>
        <p className="col-span-2 text-black text-center">
          Selecciona una ruta para ver las ubicaciones
        </p>
        <div className="col-span-2 flex gap-4 justify-center mt-4">
          <button
            onClick={() =>
              setVisitasOrPagos(
                visitasOrPagos === "visitas" ? "pagos" : "visitas"
              )
            }
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {visitasOrPagos === "visitas" ? "Visitas" : "Pagos"}
          </button>
          <select
            onChange={(e) => {
              const id = parseInt(e.target.value);
              const r = zonasCliente.find((r) => r.ZONA_CLIENTE_ID === id);
              if (r) {
                setZonaCliente(r);
              }
            }}
            className="border border-gray-400 rounded p-2 bg-blue-500"
          >
            <option value="0">Selecciona una ruta</option>
            {zonasCliente.map((zonaCliente) => (
              <option
                key={zonaCliente.ZONA_CLIENTE_ID}
                value={zonaCliente.ZONA_CLIENTE_ID}
              >
                {zonaCliente.ZONA_CLIENTE}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border border-gray-400 rounded p-2 text-black bg-white"
            value={fechaInicio.format("YYYY-MM-DD")}
            onChange={(e) =>
              setFechaInicio(dayjs(e.target.value).startOf("day"))
            }
          />
          <input
            type="date"
            className="border border-gray-400 rounded p-2 text-black bg-white"
            value={fechaFin.format("YYYY-MM-DD")}
            onChange={(e) => setFechaFin(dayjs(e.target.value).endOf("day"))}
          />
          <Link
            to="/settings"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Usuarios
          </Link>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-black">Número de pagos: {numPagos}</span>
              <span className="text-black">Total pagos: ${totalPagos}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-black">
                Número de condonaciones: {numCondonaciones}
              </span>
              <span className="text-black">
                Total condonaciones: ${totalCondonaciones}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full max-h-[50rem]">
          <div className="w-full bg-gray-200 mt-4 p-4 rounded h-full overflow-auto">
            <h2 className="text-black text-xl font-bold mb-4">
              {visitasOrPagos === "pagos"
                ? "Pagos realizados"
                : "Visitas realizadas"}
            </h2>
            {visitasOrPagos === "pagos" ? (
              <div className="flex flex-col overflow-auto">
                {loadingPagos && <p>Cargando...</p>}
                {pagos.map((pago) => (
                  <PagoItem
                    key={pago.ID}
                    pago={pago}
                    onClick={() => setPoint({ lat: pago.LAT, lng: pago.LNG })}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col overflow-auto">
                {visitasLoading && <p>Cargando...</p>}
                {visitas.map((visita) => (
                  <VisitaItem
                    key={visita.ID}
                    visita={visita}
                    onClick={() =>
                      setPoint({ lat: visita.LAT, lng: visita.LNG })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <Map point={point} />
      </div>
    </div>
  );
};

const PagoItem = ({ onClick, pago }: { onClick?: () => void; pago: Pago }) => {
  const { venta } = useGetVenta(pago.DOCTO_CC_ACR_ID);
  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[55%,20%,15%,10%] gap-2 rounded hover:bg-gray-300 p-2 cursor-pointer`}
    >
      <span className="text-black">{venta.CLIENTE}</span>
      <span className="text-black">
        {dayjs(pago.FECHA_HORA_PAGO.toDate()).format("DD/MM/YY HH:mm")}
      </span>
      <span className="text-black">
        {pago.FORMA_COBRO_ID === CONDONACION_ID
          ? "Condonación"
          : PAGO_EN_EFECTIVO_ID
          ? "Efectivo"
          : PAGO_CON_TRANSFERENCIA_ID
          ? "Transferencia"
          : "Otro"}
      </span>
      <span className="text-black">${pago.IMPORTE}</span>
    </div>
  );
};

const VisitaItem = ({
  visita,
  onClick,
}: {
  visita: Visita;
  onClick?: () => void;
}) => {
  const { venta } = useGetVentaByCliente(visita.CLIENTE_ID);
  return (
    <div
      className="grid grid-cols-4 gap-2 rounded hover:bg-gray-300 p-2 cursor-pointer"
      onClick={onClick}
    >
      <span className="text-black">{venta.CLIENTE}</span>
      <span className="text-black">{visita.TIPO_VISITA}</span>
      <span className="text-black">
        {dayjs(visita.FECHA_HORA_VISITA.toDate()).format("DD/MM/YY HH:mm")}
      </span>
      <span className="text-black">{visita.NOTA}</span>
    </div>
  );
};

export default Home;
