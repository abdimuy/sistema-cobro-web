import React from "react";
import Map from "../../components/Map";
import useGetRutas from "../user/useGetRutas";
import useGetPagos, { Pago } from "../../hooks/useGetPagos";
import { Ruta } from "../../services/api/getRutas";
import dayjs from "dayjs";

const Home = () => {
  const [point, setPoint] = React.useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [fechaInicio, setFechaInicio] = React.useState(dayjs().startOf("day"));
  const [fechaFin, setFechaFin] = React.useState(dayjs().endOf("day"));
  const [ruta, setRuta] = React.useState<Ruta>({
    COBRADOR_ID: 0,
    COBRADOR: "",
  });
  const { rutas } = useGetRutas();

  const { pagos, isLoading: loadingPagos } = useGetPagos(
    ruta.COBRADOR_ID,
    fechaInicio,
    fechaFin
  );

  return (
    <div className="w-full h-full flex justify-center bg-white">
      <div className="grid grid-cols-[30rem,1fr] grid-rows-[5rem,2rem,4rem] w-full overflow-auto">
        <h1 className="col-span-2 text-black text-4xl text-center font-bold mb-4 mt-4">
          Ubicaciones
        </h1>
        <p className="col-span-2 text-black text-center">
          Selecciona una ruta para ver las ubicaciones
        </p>
        <div className="col-span-2 flex gap-4 justify-center mt-4">
          <select
            onChange={(e) => {
              const id = parseInt(e.target.value);
              const r = rutas.find((r) => r.COBRADOR_ID === id);
              if (r) {
                setRuta(r);
              }
            }}
            className="border border-gray-400 rounded p-2 bg-blue-500"
          >
            <option value="0">Selecciona una ruta</option>
            {rutas.map((ruta) => (
              <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID}>
                {ruta.COBRADOR}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border border-gray-400 rounded p-2"
            value={fechaInicio.format("YYYY-MM-DD")}
            onChange={(e) =>
              setFechaInicio(dayjs(e.target.value).startOf("day"))
            }
          />
          <input
            type="date"
            className="border border-gray-400 rounded p-2"
            value={fechaFin.format("YYYY-MM-DD")}
            onChange={(e) => setFechaFin(dayjs(e.target.value).endOf("day"))}
          />
        </div>

        <div className="flex w-full max-h-[50rem]">
          <div className="w-full bg-gray-200 mt-4 p-4 rounded h-full overflow-auto">
            <h2 className="text-black text-xl font-bold mb-4">Ubicaciones</h2>
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
          </div>
        </div>
        <Map point={point} />
      </div>
    </div>
  );
};

const PagoItem = ({ onClick, pago }: { onClick?: () => void; pago: Pago }) => {
  return (
    <div
      onClick={onClick}
      className="flex gap-2 rounded hover:bg-gray-300 p-2 cursor-pointer"
    >
      <span className="text-black">{pago.COBRADOR}</span>
      {" - "}
      <span className="text-black">
        {dayjs(pago.FECHA_HORA_PAGO.toDate()).format("DD/MM/YYYY HH:mm")}
      </span>
      {" - "}
      <span className="text-black">${pago.IMPORTE}</span>
    </div>
  );
};

export default Home;
