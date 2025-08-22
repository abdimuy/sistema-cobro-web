import React, { useMemo, useState } from "react";
import Map from "../../components/Map";
import Navigation from "../../components/Navigation";
import dayjs from "dayjs";
import { ZonaCliente } from "../../services/api/getZonasCliente";
import useGetZonasCliente from "../user/useGetZonaCliente";
import { ColDef, ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { RowGroupingModule } from "@ag-grid-enterprise/row-grouping";
import "ag-grid-enterprise";

ModuleRegistry.registerModules([RowGroupingModule]);

import getPagosAndVisitas, {
  PagoOrVisita,
} from "../../services/api/getPagosAndVisitas";
import { AG_GRID_LOCALE_ES } from "@ag-grid-community/locale";

export interface diferenciaHoras {
  horaAnterior: string;
  horaSiguiente: string;
}

const Home = () => {
  const [columnDefs] = useState<ColDef[]>([
    {
      field: "TIPO",
      width: 100,
      enableRowGroup: true,
    },
    {
      field: "CLIENTE",
      enableRowGroup: true,
    },
    {
      field: "VENTA_ID",
      headerName: "ID VENTA",
      enableRowGroup: true,
    },
    {
      field: "FECHA",
      editable: false,
      cellEditor: "agSelectCellEditor",
      valueGetter: (params) => {
        if (!params.data) return "";
        return dayjs(params.data?.FECHA).format("DD/MM/YYYY HH:mm:ss");
      },
      comparator: (_, __, node1, node2) => {
        if (!node1.data) return 0;
        return dayjs(node1.data?.FECHA).diff(node2.data.FECHA);
      },
      floatingFilter: false,
      width: 150,
    },
    {
      field: "IMPORTE",
      width: 100,
      enableRowGroup: true,
    },
    {
      field: "NOTA",
      tooltipValueGetter: (params) => {
        if (!params.data) return null;
        return params.data?.NOTA;
      },
    },
    {
      field: "TIPO_VISITA",
      headerName: "TIPO VISITA",
      enableRowGroup: true,
    },
    {
      field: "COBRADOR",
    },
    {
      field: "LAT",
      headerName: "LATITUD",
    },
    {
      field: "LNG",
      headerName: "LONGITUD",
    },
  ]);
  const [data, setData] = useState<PagoOrVisita[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultColDef = useMemo(() => {
    return {
      filter: "agTextColumnFilter",
      floatingFilter: true,
    };
  }, []);

  const [point, setPoint] = React.useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [fechaInicio, setFechaInicio] = React.useState(dayjs().startOf("day"));
  const [fechaFin, setFechaFin] = React.useState(dayjs().endOf("day"));
  const [zonaCliente, setZonaCliente] = React.useState<ZonaCliente>({
    ZONA_CLIENTE_ID: 0,
    ZONA_CLIENTE: "",
  });
  const [showMap, setShowMap] = React.useState<boolean>(false);
  const { zonasCliente } = useGetZonasCliente();

  const getPagosYVisitas = async () => {
    setLoading(true);
    try {
      const pagosYVisitas = await getPagosAndVisitas(
        zonaCliente.ZONA_CLIENTE_ID,
        fechaInicio,
        fechaFin
      );
      setData(pagosYVisitas);
      console.log(pagosYVisitas);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // const exportFile = (data: Visita[]) => {
  //   const horas = revisarVisitas();
  //   const dataExport = data.map((d) => ({
  //     ...d,
  //     FECHA_HORA_VISITA: dayjs(d.FECHA_HORA_VISITA.toDate()).format(
  //       "DD/MM/YY HH:mm"
  //     ),
  //   }));
  //   /* generate worksheet from state */
  //   const ws = utils.json_to_sheet(dataExport);
  //   ws["!cols"] = [
  //     { wch: 30 },
  //     { wch: 15 },
  //     { wch: 20 },
  //     { wch: 30 },
  //     { wch: 10 },
  //     { wch: 10 },
  //     { wch: 10 },
  //   ];
  //   const ws2 = utils.json_to_sheet(horas);
  //   ws2["!cols"] = [{ wch: 20 }, { wch: 20 }];
  //   /* create workbook and append worksheet */
  //   const wb = utils.book_new();
  //   utils.book_append_sheet(wb, ws, "LISTA DE VISITAS");
  //   utils.book_append_sheet(wb, ws2, "HORAS ENTRE VISITAS Y PAGOS");

  //   /* export to XLSX */
  //   writeFile(wb, `visitas-${dayjs().format("YYYY-MM-DD HH:mm")}.xlsx`);
  // };

  const groupRowRenderer = (params: any) => {
    const nodeIndex = params.node.rowIndex + 1; // Número de grupo (secuencial)
    return (
      <span>
        {`Grupo ${nodeIndex}: ${params.value}`}{" "}
        {/* Muestra el número del grupo */}
      </span>
    );
  };

  return (
    <div className="w-full h-full flex justify-center bg-white">
      <div className="grid grid-cols-[5fr,3fr] gap-2 grid-rows-[4rem,4rem] w-full overflow-auto">
        <h1 className="col-span-2 text-black text-2xl font-bold text-center mb-4 mt-4 ml-4">
          Pagos y visitas
        </h1>
        <div className="col-span-2 flex gap-4 justify-center mt-4">
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
            onChange={(e) => {
              console.log(e.target.value);
              // dayjs(e.target.value).isValid()
              setFechaInicio(dayjs(e.target.value).startOf("day"));
            }}
          />
          <input
            type="date"
            className="border border-gray-400 rounded p-2 text-black bg-white"
            value={fechaFin.format("YYYY-MM-DD")}
            onChange={(e) => setFechaFin(dayjs(e.target.value).endOf("day"))}
          />
          <button
            onClick={getPagosYVisitas}
            disabled={zonaCliente.ZONA_CLIENTE_ID === 0 || loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buscar
          </button>
        </div>

        {loading ? (
          <div className="col-span-2 flex justify-center items-center">
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
          <>
            <div
              className={`ag-theme-quartz ${
                showMap ? "col-span-1" : "col-span-2"
              }`}
              style={{ height: "100%", paddingTop: 20 }}
            >
              <AgGridReact
                rowData={data}
                // @ts-ignore
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                groupRowRenderer={groupRowRenderer}
                onRowClicked={(e) => {
                  const row = e.data;
                  setPoint({
                    lat: parseFloat(row.LAT),
                    lng: parseFloat(row.LNG),
                  });
                }}
                rowGroupPanelShow={"always"}
                tooltipShowMode="standard"
                tooltipShowDelay={500}
                pagination={true}
                localeText={AG_GRID_LOCALE_ES}
                // rowSelection="multiple"
                // suppressRowClickSelection={true}
                // pagination={true}
                // paginationPageSize={10}
                // paginationPageSizeSelector={[10, 25, 50]}
              />
            </div>
            {showMap && <Map points={[point || { lat: 0, lng: 0 }]} />}
          </>
        )}
      </div>
      
      {/* Navegación profesional */}
      <Navigation 
        showMap={showMap} 
        onToggleMap={() => setShowMap((value) => !value)} 
      />
    </div>
  );
};

export default Home;
