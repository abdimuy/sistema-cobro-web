import React from "react";
import { Evento } from "../../services/api/getEventosByGarantia";
import { URL_API } from "../../constants/api";
import GarantiaStatusBadge from "./GarantiaStatusBadge";
import { getEstadoColors } from "./estadoColors";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { Plus } from "lucide-react";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface GarantiaTimelineProps {
  eventos: Evento[];
  getEstadoLabel: (value: string) => string;
  onAddEvento: () => void;
  onImageClick: (imgPath: string) => void;
}

const GarantiaTimeline: React.FC<GarantiaTimelineProps> = ({
  eventos,
  getEstadoLabel,
  onAddEvento,
  onImageClick,
}) => {
  const sorted = [...eventos].sort(
    (a, b) =>
      new Date(b.FECHA_EVENTO).getTime() - new Date(a.FECHA_EVENTO).getTime()
  );

  return (
    <div className="relative">
      {/* Add event button */}
      <button
        onClick={onAddEvento}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Agregar evento</span>
      </button>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />

        {sorted.map((evento) => {
          const colors = getEstadoColors(evento.TIPO_EVENTO);
          return (
            <div key={evento.ID} className="relative pb-6 last:pb-0">
              {/* Dot */}
              <div
                className={`absolute left-[-15px] top-1 w-3 h-3 rounded-full border-2 border-background ${colors.dot}`}
              />

              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <GarantiaStatusBadge
                    estado={evento.TIPO_EVENTO}
                    label={getEstadoLabel(evento.TIPO_EVENTO)}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground cursor-help">
                          {dayjs(evento.FECHA_EVENTO).fromNow()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {dayjs(evento.FECHA_EVENTO).format(
                          "DD/MM/YYYY hh:mm A"
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {evento.COMENTARIO && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {evento.COMENTARIO}
                  </p>
                )}

                {evento.IMAGENES && evento.IMAGENES.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {evento.IMAGENES.map((img) => (
                      <img
                        key={img.ID}
                        src={`${URL_API}${img.IMG_PATH}`}
                        alt={img.IMG_DESC || "Imagen de evento"}
                        className="w-16 h-16 object-cover rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onImageClick(`${URL_API}${img.IMG_PATH}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground pl-2">
            No hay eventos registrados
          </p>
        )}
      </div>
    </div>
  );
};

export default GarantiaTimeline;
