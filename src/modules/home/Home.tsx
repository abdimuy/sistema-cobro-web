import React, { useMemo, useState } from "react";
import { MapPin, MapPinOff, Search, Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Map from "../../components/Map";
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

function DatePicker({ value, onChange }: { value: dayjs.Dayjs; onChange: (d: dayjs.Dayjs) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-xs font-normal min-w-[130px] justify-start"
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          {value.format("DD/MM/YYYY")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value.toDate()}
          onSelect={(date) => {
            if (date) {
              onChange(dayjs(date));
              setOpen(false);
            }
          }}
          defaultMonth={value.toDate()}
        />
      </PopoverContent>
    </Popover>
  );
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
    } catch (error) {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const groupRowRenderer = (params: any) => {
    const nodeIndex = params.node.rowIndex + 1;
    return (
      <span>
        {`Grupo ${nodeIndex}: ${params.value}`}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="shrink-0 border-b border-border/40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold text-foreground">
              Pagos y visitas
            </h1>
            <Button
              variant={showMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMap((v) => !v)}
              className="gap-1.5 h-8 text-xs"
            >
              {showMap ? <MapPinOff className="size-3.5" /> : <MapPin className="size-3.5" />}
              <span className="hidden sm:inline">{showMap ? "Ocultar mapa" : "Mostrar mapa"}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 pb-4 flex-wrap">
            <Select
              value={zonaCliente.ZONA_CLIENTE_ID === 0 ? undefined : String(zonaCliente.ZONA_CLIENTE_ID)}
              onValueChange={(val) => {
                const id = parseInt(val);
                const r = zonasCliente.find((r) => r.ZONA_CLIENTE_ID === id);
                if (r) setZonaCliente(r);
              }}
            >
              <SelectTrigger className="h-9 w-[220px] text-xs">
                <SelectValue placeholder="Selecciona una ruta" />
              </SelectTrigger>
              <SelectContent>
                {zonasCliente.map((z) => (
                  <SelectItem key={z.ZONA_CLIENTE_ID} value={String(z.ZONA_CLIENTE_ID)}>
                    {z.ZONA_CLIENTE}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePicker
              value={fechaInicio}
              onChange={(d) => setFechaInicio(d.startOf("day"))}
            />
            <DatePicker
              value={fechaFin}
              onChange={(d) => setFechaFin(d.endOf("day"))}
            />

            <Button
              size="sm"
              onClick={getPagosYVisitas}
              disabled={zonaCliente.ZONA_CLIENTE_ID === 0 || loading}
              className="h-9 gap-1.5 text-xs"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              Buscar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className={`flex h-full ${showMap ? "gap-0" : ""}`}>
            <div
              className={`ag-theme-quartz ${showMap ? "flex-[5]" : "flex-1"}`}
              style={{ height: "100%" }}
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
              />
            </div>
            {showMap && (
              <div className="flex-[3]">
                <Map points={[point || { lat: 0, lng: 0 }]} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
