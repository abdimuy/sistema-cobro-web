import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CampoInline } from "./CampoInline";
import type { VendedorFormData } from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendedorChipEditableProps {
  vendedor: VendedorFormData;
  onRemove: () => void;
  onEdit: (
    field: keyof VendedorFormData,
    value: VendedorFormData[keyof VendedorFormData],
  ) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const iniciales = (nombre: string): string => {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Component ────────────────────────────────────────────────────────────────

export const VendedorChipEditable = ({
  vendedor,
  onRemove,
  onEdit,
}: VendedorChipEditableProps) => {
  return (
    <div className="group relative">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card py-1 pl-1 pr-2 hover:bg-muted/40 transition-colors text-left"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
              {iniciales(vendedor.nombre)}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-medium text-foreground">
                {vendedor.nombre}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {vendedor.email}
              </span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <div className="border-b border-border/60 px-4 py-3">
            <h4 className="font-serif text-base">Editar vendedor</h4>
          </div>
          <div className="px-4 py-4 space-y-3">
            <CampoInline label="Nombre" obligatorio>
              <Input
                value={vendedor.nombre}
                onChange={(e) => onEdit("nombre", e.target.value)}
              />
            </CampoInline>
            <CampoInline label="Email" obligatorio>
              <Input
                type="email"
                value={vendedor.email}
                onChange={(e) => onEdit("email", e.target.value)}
              />
            </CampoInline>
          </div>
          <div className="border-t border-border/60 px-4 py-3 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-3 w-3 mr-1" /> Quitar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Floating X for one-click remove */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Quitar vendedor"
        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
};
