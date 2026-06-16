import { Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EstadoPagoBadge from "../badges/EstadoPagoBadge";
import type { FichaCliente } from "../../domain/entities/FichaCliente";

interface Props {
  ficha: FichaCliente;
}

export function FichaHeader({ ficha }: Props) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-[56px] shrink-0 items-center justify-between",
        "border-b border-border/60 bg-background/95 px-6",
        "backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        <Link
          to="/clientes"
          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Clientes
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="truncate max-w-[260px] text-foreground tracking-wide">
          {ficha.nombre}
        </span>
        {ficha.pulso && (
          <span className="ml-1">
            <EstadoPagoBadge value={ficha.pulso.estadoPago} />
          </span>
        )}
      </div>

      {/* Right: Llamar button */}
      {ficha.telefono && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-7 gap-1.5 font-mono text-xs"
        >
          <a href={`tel:${ficha.telefono}`}>
            <Phone className="h-3 w-3" />
            Llamar
          </a>
        </Button>
      )}
    </header>
  );
}
