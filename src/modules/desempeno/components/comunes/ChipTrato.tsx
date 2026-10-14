import { cn } from "@/lib/utils";
import type { Trato } from "../../domain/values/estadoCuenta";
import { CLASE_RELLENO, CLASE_TONO, TRATO_META } from "../lib/tratoMeta";

export function ChipTrato({ trato, etiqueta }: { trato: Trato; etiqueta: string }) {
  const meta = TRATO_META[trato];
  const Icono = meta.icono;
  return (
    <span
      data-trato={trato}
      className={cn(
        "inline-flex h-[22px] items-center gap-[5px] whitespace-nowrap rounded-full px-2 text-[11.5px] font-medium",
        meta.relleno ? CLASE_RELLENO[meta.tono] : CLASE_TONO[meta.tono],
      )}
    >
      <Icono aria-hidden className="h-3 w-3" />
      {etiqueta}
    </span>
  );
}
