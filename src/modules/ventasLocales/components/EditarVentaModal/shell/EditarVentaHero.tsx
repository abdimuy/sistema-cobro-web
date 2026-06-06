import { useState } from "react";
import dayjs from "dayjs";
import type { VentaV2 } from "@/services/api/ventaV2Types";

const fmtMoney = (n: number): string =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </p>
    <p className="font-mono text-[15px] tabular-nums text-foreground">{value}</p>
  </div>
);

interface Props {
  venta: VentaV2;
  nombre: string;
  onNombreChange: (v: string) => void;
  totalAnualCalculado: number;
  activeProductsCount: number;
  activeImagesCount: number;
}

export const EditarVentaHero = ({
  venta,
  nombre,
  onNombreChange,
  totalAnualCalculado,
  activeProductsCount,
  activeImagesCount,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nombre);

  const commit = () => {
    onNombreChange(draft || nombre);
    setEditing(false);
  };

  const startEditing = () => {
    setDraft(nombre);
    setEditing(true);
  };

  const fechaFormatted = dayjs(venta.fecha_venta).format("DD MMM YYYY");
  const folio = venta.microsip_folio ?? `MSP-${venta.id.slice(0, 8).toUpperCase()}`;

  return (
    <header className="px-8 pt-10 pb-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 sm:max-w-[60%]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            EDITANDO · {fechaFormatted}
          </p>
          <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
            {editing ? (
              <input
                className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight bg-transparent border-0 outline-none focus:ring-0 w-full"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setDraft(nombre);
                    setEditing(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="text-left hover:bg-muted/40 -mx-1 px-1 rounded transition-colors"
              >
                {nombre || "Sin nombre"}
              </button>
            )}
          </h1>
          <p className="font-mono text-[15px] tabular-nums text-muted-foreground">
            {folio} · {venta.tipo_venta}
          </p>
        </div>
        <div className="space-y-3 text-right sm:min-w-[240px]">
          <Stat label="Total anual" value={fmtMoney(totalAnualCalculado)} />
          <Stat label="Productos" value={String(activeProductsCount)} />
          <Stat label="Imágenes" value={String(activeImagesCount)} />
        </div>
      </div>
    </header>
  );
};
