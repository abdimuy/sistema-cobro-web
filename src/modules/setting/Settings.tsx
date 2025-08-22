import React, { useState, useEffect } from "react";
import useGetCobradores from "../../hooks/useGetCobradores";
import Navigation from "../../components/Navigation";
import useGetRutas from "../user/useGetRutas";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  CONFIG_COLLECTION,
  USERS_COLLECTION,
} from "../../constants/collections";
import useGetZonasCliente from "../user/useGetZonaCliente";
import dayjs from "dayjs";
import { API_SETTINGS_DOC } from "../../constants/values";
import getConfigAPI from "../../services/api/getConfigAPI";
import validateURL from "../../utils/validateURL";

const Settings = () => {
  const { cobradores } = useGetCobradores();
  const [urlApi, setUrlApi] = useState("");
  const [errorsURL, setErrorsURL] = useState<string[]>([]);
  const [isValidURL, setIsValidURL] = useState<boolean>(true);
  // console.log(
  //   dayjs(cobradores[0].FECHA_CARGA_INICIAL.toDate()).format("DD/MM/YYYY HH:mm")
  // );
  const { rutas } = useGetRutas();
  const { zonasCliente } = useGetZonasCliente();

  const getURLAPI = () => {
    getConfigAPI()
      .then((settings) => {
        setUrlApi(settings.baseURL);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getURLAPI();
  }, []);

  const handleSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    email: string
  ) => {
    const cobradorId = parseInt(e.target.value);
    const cobrador = cobradores.find((cobrador) => cobrador.EMAIL === email);

    if (!cobrador) return;

    updateDoc(doc(db, USERS_COLLECTION, cobrador.ID), {
      COBRADOR_ID: cobradorId,
    });
  };

  const handlerUpdateURLAPI = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const res = validateURL(url);
    setIsValidURL(res.valido);
    setErrorsURL(res.errores);
    setUrlApi(url);

    if (!url) return;

    updateDoc(doc(db, CONFIG_COLLECTION, API_SETTINGS_DOC), {
      baseURL: url,
    });
  };

  const handleSelectZona = (
    e: React.ChangeEvent<HTMLSelectElement>,
    email: string
  ) => {
    const zonaId = parseInt(e.target.value);
    const cobrador = cobradores.find((cobrador) => cobrador.EMAIL === email);

    if (!cobrador) return;

    updateDoc(doc(db, USERS_COLLECTION, cobrador.ID), {
      ZONA_CLIENTE_ID: zonaId,
    });
  };

  const handleUpdatePhone = (
    e: React.ChangeEvent<HTMLInputElement>,
    COBRADOR_ID: string
  ) => {
    const phone = e.target.value;

    updateDoc(doc(db, USERS_COLLECTION, COBRADOR_ID), {
      TELEFONO: phone,
    });
  };

  const handleUpdateFechaInicioSemana = (
    e: React.ChangeEvent<HTMLInputElement>,
    COBRADOR_ID: string
  ) => {
    const date = e.target.value;
    updateDoc(doc(db, USERS_COLLECTION, COBRADOR_ID), {
      FECHA_CARGA_INICIAL: Timestamp.fromDate(new Date(date)),
    });
  };

  const handleToggleModule = (
    module: string,
    cobradorId: string,
    currentModules: string[] = []
  ) => {
    let newModules: string[];
    if (currentModules.includes(module)) {
      newModules = currentModules.filter(m => m !== module);
    } else {
      newModules = [...currentModules, module];
    }
    
    updateDoc(doc(db, USERS_COLLECTION, cobradorId), {
      MODULOS: newModules,
    });
  };

  return (
    <div className="w-full h-full flex justify-center bg-white">
      <div className="grid grid-cols-[30rem,1fr] grid-rows-[5rem,4rem,4rem,4rem,1fr] w-full overflow-auto">
        <h1 className="col-span-2 text-black text-4xl text-center font-bold mb-4 mt-4">
          Configuración
        </h1>
        <div className="flex flex-row justify-center col-span-2 items-center gap-4 px-8 mb-4">
          <div className="flex flex-col">
            <label className="text-black font-bold">URL del servidor</label>
            <label className="text-gray-600">
              Dirección por defecto: https://msp2025.loclx.io/
            </label>
            <label className="text-gray-600">
              Dirección local: http://serverm:3001/
            </label>
          </div>
          <input
            onChange={handlerUpdateURLAPI}
            value={urlApi}
            className="bg-transparent border border-gray-400 rounded p-2 text-black flex-1 max-h-[50px]"
          />
        </div>
        {!isValidURL && (
          <div
            className="flex col-span-2 justify-self-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:text-red-400"
            role="alert"
          >
            <svg
              className="shrink-0 inline w-4 h-4 me-3 mt-[2px]"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <span className="sr-only">Danger</span>
            <div>
              <span className="font-medium">
                Ensure that these requirements are met:
              </span>
              <ul className="mt-1.5 list-disc list-inside">
                {errorsURL.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="col-span-2 relative w-full shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3">
                  Correo
                </th>
                <th scope="col" className="px-6 py-3">
                  Ruta
                </th>
                <th scope="col" className="px-6 py-3">
                  Zona
                </th>
                <th scope="col" className="px-6 py-3">
                  Telefono
                </th>
                <th scope="col" className="px-6 py-3">
                  Fecha inicio de semana
                </th>
                <th scope="col" className="px-6 py-3">
                  Módulos
                </th>
              </tr>
            </thead>
            <tbody>
              {cobradores.map((cobrador) => (
                <tr
                  key={cobrador.ID}
                  className="odd:bg-white even:bg-gray-50 border-b"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                  >
                    {cobrador.EMAIL}
                  </th>
                  <td className="px-6 py-4">{cobrador.NOMBRE}</td>
                  <td className="px-6 py-4">
                    <select
                      className="border border-gray-400 rounded p-2 bg-white"
                      value={cobrador.COBRADOR_ID}
                      onChange={(e) => handleSelect(e, cobrador.EMAIL)}
                    >
                      <option value="0">Selecciona una ruta</option>
                      {rutas.map((ruta) => (
                        <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID}>
                          {ruta.COBRADOR}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={cobrador.ZONA_CLIENTE_ID}
                      onChange={(e) => handleSelectZona(e, cobrador.EMAIL)}
                      className="border border-gray-400 rounded p-2 bg-white"
                    >
                      <option value="0">Selecciona una zona</option>
                      {zonasCliente.map((zona) => (
                        <option
                          key={zona.ZONA_CLIENTE_ID}
                          value={zona.ZONA_CLIENTE_ID}
                        >
                          {zona.ZONA_CLIENTE}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <input
                      className="bg-transparent border border-gray-400 rounded p-2"
                      type="text"
                      defaultValue={cobrador.TELEFONO}
                      onBlur={(e) => handleUpdatePhone(e, cobrador.ID)}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <input
                      className="bg-transparent border border-gray-400 rounded p-2"
                      type="datetime-local"
                      defaultValue={dayjs(
                        cobrador.FECHA_CARGA_INICIAL.toDate()
                      ).format("YYYY-MM-DDTHH:mm")}
                      // defaultValue={"12/09/2024 09:27"}
                      onBlur={(e) =>
                        handleUpdateFechaInicioSemana(e, cobrador.ID)
                      }
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleModule("COBRO", cobrador.ID, cobrador.MODULOS)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                          cobrador.MODULOS?.includes("COBRO")
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        COBRO
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleModule("VENTAS", cobrador.ID, cobrador.MODULOS)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                          cobrador.MODULOS?.includes("VENTAS")
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        VENTAS
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Navegación profesional */}
      <Navigation />
    </div>
  );
};

export default Settings;
