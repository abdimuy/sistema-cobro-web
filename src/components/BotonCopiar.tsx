import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const MS_COPIADO = 1500;

/**
 * Botón chico para copiar un texto al portapapeles. Discreto: aparece al pasar
 * el mouse por la fila (el contenedor debe llevar `group`) y queda tenue en
 * pantallas táctiles. No propaga el clic, así que no abre el detalle de la fila.
 */
export function BotonCopiar({
  texto,
  etiqueta = "Copiar nombre del cliente",
  className,
}: {
  texto: string;
  etiqueta?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const copiar = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      return; // sin permiso o sin portapapeles: no se aparenta que se copió
    }
    setCopiado(true);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setCopiado(false), MS_COPIADO);
  };

  const Icono = copiado ? Check : Copy;
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={copiado ? "Copiado" : "Copiar nombre"}
      onClick={copiar}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "ml-1.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 [@media(hover:none)]:opacity-60",
        copiado && "text-dsm-ok opacity-100",
        className,
      )}
    >
      <Icono aria-hidden className="h-3.5 w-3.5" />
    </button>
  );
}
