import { Camera } from "lucide-react";
import { refImagenesDeActividad, type Actividad } from "../../domain/entities";
import { plural } from "../lib/format";
import { InfoRapida, TarjetaSub, TarjetaTitulo } from "../comunes/InfoRapida";
import { GaleriaFotos } from "./GaleriaFotos";

const MINIATURAS_EN_POPOVER = 3;

function TarjetaFotos({ actividad }: { actividad: Actividad }) {
  return (
    <div className="w-[260px]">
      <TarjetaTitulo>{plural(actividad.numFotos, "foto", "fotos")}</TarjetaTitulo>
      <TarjetaSub>clic en el renglón para verlas</TarjetaSub>
      <div className="mt-2">
        <GaleriaFotos
          refImagenes={refImagenesDeActividad(actividad)}
          mensajeSinFotos="Sin comprobante"
          limite={MINIATURAS_EN_POPOVER}
        />
      </div>
    </div>
  );
}

// Celda "Fotos" de la lista y la tabla (la integración la pasa como renderFotos).
// Las miniaturas se piden solo al abrir el popover (el contenido se monta al abrir).
export function CeldaFotos({ actividad }: { actividad: Actividad }) {
  if (actividad.numFotos === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <InfoRapida contenido={<TarjetaFotos actividad={actividad} />}>
      <span tabIndex={0} className="inline-flex cursor-help items-center gap-1 text-muted-foreground">
        <Camera aria-hidden className="h-3.5 w-3.5" />
        {actividad.numFotos}
      </span>
    </InfoRapida>
  );
}
