import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";

const ETIQUETA = "Venta del sistema anterior";

/**
 * Marca de una venta del sistema anterior. `circulo` (tabla) ocupa el lugar del
 * anillo de fase; `insignia` (encabezado del panel) es la versión en píldora.
 * Colores de los tokens `--archivo-*` (claro y oscuro en index.css).
 */
export function ArchivoBadge({
  className,
  variant = "circulo",
}: {
  className?: string;
  variant?: "circulo" | "insignia";
}) {
  const icono = (px: number) => (
    <Archive
      aria-hidden="true"
      width={px}
      height={px}
      style={{ color: "var(--archivo-trazo)" }}
    />
  );
  if (variant === "insignia") {
    return (
      <span
        role="img"
        aria-label={ETIQUETA}
        title={ETIQUETA}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
          className,
        )}
        style={{
          background: "var(--archivo-circulo)",
          boxShadow: "inset 0 0 0 1.5px var(--archivo-borde)",
          color: "var(--archivo-texto)",
        }}
      >
        {icono(12)}
        Archivo
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={ETIQUETA}
      title={ETIQUETA}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span
        className="inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full"
        style={{
          background: "var(--archivo-circulo)",
          boxShadow: "inset 0 0 0 1.5px var(--archivo-borde)",
        }}
      >
        {icono(15)}
      </span>
      <span
        className="text-[11px] font-semibold"
        style={{ color: "var(--archivo-texto)" }}
      >
        Archivo
      </span>
    </span>
  );
}
