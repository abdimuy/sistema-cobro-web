import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ValidationError } from "../../../presentation/hooks/useVentaEditState";

// Section mapping for errors
function fieldToSection(field: string): string {
  if (field.startsWith("cliente.") || field === "cliente" || field === "gps") return "Cliente";
  if (
    field.startsWith("financiero.") ||
    field === "financiero" ||
    /^(monto|plan|dia_cobranza|nota|fecha_venta)/.test(field)
  ) return "Plan";
  if (field.startsWith("productos")) return "Productos";
  if (field.startsWith("combos")) return "Productos";
  if (field.startsWith("vendedores")) return "Vendedores";
  if (field.startsWith("imagen")) return "Imágenes";
  return "Otros";
}

interface FooterCounterProps {
  cambiosCount: number;
  errors: ValidationError[];
}

const FooterCounter = ({ cambiosCount, errors }: FooterCounterProps) => {
  if (errors.length > 0) {
    const sections = new Set(errors.map((e) => fieldToSection(e.field)));
    return (
      <span className="flex items-center gap-2 text-[11px] text-destructive">
        <AlertCircle className="h-3 w-3" />
        {errors.length} errores en {sections.size} {sections.size === 1 ? "sección" : "secciones"}
      </span>
    );
  }
  if (cambiosCount === 0) {
    return <span className="text-[11px] text-muted-foreground">Sin cambios</span>;
  }
  return (
    <span className="text-[11px] text-foreground">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full bg-chart-4/70 mr-2 align-middle",
        )}
      />
      <span className="font-medium">{cambiosCount}</span> cambios pendientes
    </span>
  );
};

interface Props {
  isDirty: boolean;
  cambiosCount: number;
  errors: ValidationError[];
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export const EditarVentaFooterBar = ({
  isDirty,
  cambiosCount,
  errors,
  saving,
  onDiscard,
  onSave,
}: Props) => (
  <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <FooterCounter cambiosCount={cambiosCount} errors={errors} />
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onDiscard}
        className="text-muted-foreground"
      >
        Descartar
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onSave}
        disabled={errors.length > 0 || saving || !isDirty}
      >
        {saving ? "Guardando..." : "Revisar y guardar"}
      </Button>
    </div>
  </footer>
);
