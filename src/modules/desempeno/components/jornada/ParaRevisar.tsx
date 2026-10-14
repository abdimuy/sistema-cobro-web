import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Senal } from "../../domain/entities";
import { InfoRapida, TarjetaNota, TarjetaTitulo } from "../comunes/InfoRapida";
import { SENAL_META } from "./senalMeta";

// "Para revisar" (spec §4.2): señales calculadas por el servidor, con su regla.
export function ParaRevisar({
  senales,
  onSeleccionar,
}: {
  senales: readonly Senal[];
  onSeleccionar: (actividadId: string) => void;
}) {
  return (
    <div className="rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border">
      <div className="flex items-center justify-between px-[18px] py-3">
        <h3 className="flex items-center gap-2 text-[13px] font-medium">
          <Flag aria-hidden className="h-3.5 w-3.5" />
          Para revisar
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">{`${senales.length} este día`}</span>
      </div>
      {senales.length === 0 ? (
        <p className="px-[18px] pb-5 text-center font-serif text-[15px]">Nada que revisar este día</p>
      ) : (
        senales.map((s, i) => {
          const meta = SENAL_META[s.tipo];
          const Icono = meta.icono;
          const primera = s.actividadIds[0];
          return (
            <InfoRapida
              key={`${s.tipo}-${i}`}
              contenido={
                <>
                  <TarjetaTitulo>Por qué aparece</TarjetaTitulo>
                  <TarjetaNota>{s.regla}</TarjetaNota>
                </>
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (primera) onSeleccionar(primera);
                }}
                className="flex w-full items-start gap-3 border-t border-border px-[18px] py-2.5 text-left hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md",
                    meta.clase,
                  )}
                >
                  <Icono aria-hidden className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[13px]">{meta.titulo}</span>
                  <span className="block text-[12px] text-muted-foreground">{s.detalle}</span>
                </span>
              </button>
            </InfoRapida>
          );
        })
      )}
    </div>
  );
}
