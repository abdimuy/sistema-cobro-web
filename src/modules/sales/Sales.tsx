import { useMemo, useState } from "react";
import useGetZonasCliente from "../user/useGetZonaCliente";
import { ZonaCliente } from "../../services/api/getZonasCliente";
import useGetVentasByZona from "../../hooks/useGetVentasByZona";
import { ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { AG_GRID_LOCALE_ES } from "@ag-grid-community/locale";
import dayjs from "dayjs";
import "ag-grid-enterprise";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";
import useGetPagosByVentaId from "../../hooks/useGetPagosByVentaId";
import Map from "../../components/Map";

dayjs.extend(relativeTime);

const Sales = () => {
  dayjs.locale("es");
  const { zonasCliente } = useGetZonasCliente();
  const [zonaCliente, setZonaCliente] = useState<ZonaCliente>({
    ZONA_CLIENTE_ID: 0,
    ZONA_CLIENTE: "",
  });
  const [ventaId, setVentaId] = useState<number>(0);
  const [showMap, setShowMap] = useState<boolean>(false);
  console.log(showMap);
  const { pagos } = useGetPagosByVentaId(ventaId);
  console.log(pagos);
  const [colDef] = useState<ColDef[]>([
    {
      field: "FOLIO",
      checkboxSelection: true,
      width: 150,
    },
    {
      field: "CLIENTE",
      width: 250,
    },
    {
      field: "FECHA",
      width: 120,
      valueGetter: (params) => {
        if (!params.data) return "";
        return dayjs(params.data?.FECHA).format("DD/MM/YYYY");
      },
      comparator: (_, __, node1, node2) => {
        if (!node1.data) return 0;
        return dayjs(node1.data?.FECHA).diff(node2.data.FECHA);
      },
      floatingFilter: false,
    },
    {
      field: "PRECIO_TOTAL",
      headerName: "TOTAL VENTA",
      width: 100,
      valueGetter: (params) => {
        if (!params.data) return "";
        return "$" + params.data?.PRECIO_TOTAL;
      },
    },
    {
      field: "SALDO_REST",
      headerName: "SALDO",
      width: 120,
      valueGetter: (params) => {
        if (!params.data) return "";
        return "$" + params.data?.SALDO_REST;
      },
    },
    {
      field: "NUM_PLAZOS_ATRASADOS_BY_SALDO",
      headerName: "PAGOS ATRASADOS",
      width: 150,
    },
    {
      field: "FECHA_ULT_PAGO",
      headerName: "ULT. PAGO",
      valueGetter: (params) => {
        if (!params.data) return "";
        return `
          ${dayjs(params.data?.FECHA_ULT_PAGO).format("DD/MM/YYYY")}
          ${dayjs(params.data?.FECHA_ULT_PAGO).fromNow()}
        `;
      },
    },
    {
      field: "PARCIALIDAD",
      width: 120,
    },
    {
      field: "NUM_IMPORTES",
      headerName: "NUM. PAGOS",
      width: 100,
    },
    {
      field: "DOMICILIO",
      width: 300,
    },
    {
      field: "LOCALIDAD",
      width: 150,
    },
    {
      field: "VENDEDOR_1",
      headerName: "VENDEDORES",
      valueGetter: (params) => {
        if (!params.data) return "";
        return `${params.data?.VENDEDOR_1} ${", " + params.data?.VENDEDOR_2} ${
          " ," + params.data?.VENDEDOR_3
        }`;
      },
    },
  ]);

  const defaultColDef = useMemo(() => {
    return {
      filter: "agTextColumnFilter",
      floatingFilter: true,
    };
  }, []);

  const { ventas, loading } = useGetVentasByZona(zonaCliente.ZONA_CLIENTE_ID);

  return (
    <div className="flex flex-col bg-white w-full h-[100vh] pt-4">
      <h1 className="text-black text-4xl font-bold text-center">
        Ventas por ruta
      </h1>

      <div className="col-span-2 flex gap-4 justify-center mt-4 items-center">
        <p className="col-span-2 text-black text-center">
          Selecciona una ruta para ver las ventas
        </p>
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
        <Link
          to="/"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ir a Pagos
        </Link>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowMap((value) => !value)}
        >
          {showMap ? "Ocultar mapa" : "Mostrar mapa"}
        </button>
      </div>

      {loading ? (
        <div className="col-span-2 flex flex-1 justify-center items-center">
          <div role="status">
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-200 animate-spin fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-4 w-full h-full">
          <div
            className={"ag-theme-quartz"}
            style={{
              display: "flex",
              paddingTop: 20,
              width: showMap ? "60%" : "100%",
            }}
          >
            <AgGridReact
              className="w-full"
              rowData={ventas}
              // @ts-ignore
              columnDefs={colDef}
              defaultColDef={defaultColDef}
              localeText={AG_GRID_LOCALE_ES}
              onRowClicked={(e) => setVentaId(e.data.DOCTO_CC_ACR_ID)}
            />
          </div>
          {showMap && (
            <Map
              points={pagos
                .map((pago) => ({
                  lat: Number(pago.LAT),
                  lng: Number(pago.LON),
                }))
                .filter((pago) => !(pago.lat === 0 || pago.lng === 0))}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Sales;
