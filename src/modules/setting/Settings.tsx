import React from "react";
import { Link } from "react-router-dom";
import useGetCobradores from "../../hooks/useGetCobradores";
import useGetRutas from "../user/useGetRutas";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { USERS_COLLECTION } from "../../constants/collections";

const Settings = () => {
  const { cobradores } = useGetCobradores();
  const { rutas } = useGetRutas();

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

  return (
    <div className="w-full h-full flex justify-center bg-white">
      <div className="grid grid-cols-[30rem,1fr] grid-rows-[5rem,4rem,1fr] w-full overflow-auto">
        <h1 className="col-span-2 text-black text-4xl text-center font-bold mb-4 mt-4">
          Configuración
        </h1>

        <Link
          to="/create-user"
          className="col-span-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded h-10 w-full flex items-center justify-center"
        >
          Crear Usuario
        </Link>
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
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {cobradores.map((cobrador) => (
                <tr
                  key={cobrador.COBRADOR_ID}
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
                    {/* {
                      rutas.find(
                        (ruta) => ruta.COBRADOR_ID === cobrador.COBRADOR_ID
                      )?.COBRADOR
                    } */}
                  </td>
                  {/* <td className="px-6 py-4">{cobrador.RUTA}</td> */}
                  <td className="px-6 py-4">
                    <a
                      href="#"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;
