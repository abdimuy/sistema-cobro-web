import { Pencil, RotateCcw, X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import AuthenticatedImage from "../../detalle/AuthenticatedImage";
import type { ImagenFormData } from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImagenTileEditableProps {
  imagen: ImagenFormData;
  ventaId: string;
  onUpdateDescripcion: (descripcion: string) => void;
  onRemove: () => void;
  onRestore: () => void;
  onClickPreview?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ImagenTileEditable = ({
  imagen,
  ventaId,
  onUpdateDescripcion,
  onRemove,
  onRestore,
  onClickPreview,
}: ImagenTileEditableProps) => {
  const descripcionInputRef = useRef<HTMLInputElement>(null);

  const isDeleted = imagen.kind === "existing" && imagen.isDeleted;
  const isNew = imagen.kind === "new";

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted",
        onClickPreview && !isDeleted && "cursor-pointer",
      )}
      onClick={onClickPreview && !isDeleted ? onClickPreview : undefined}
    >
      {/* Image */}
      {imagen.kind === "existing" ? (
        <AuthenticatedImage
          ventaId={ventaId}
          imagenId={imagen.id}
          className={cn(
            "h-full w-full object-cover",
            isDeleted && "opacity-40 saturate-0",
          )}
        />
      ) : (
        <img
          src={imagen.previewUrl}
          className="h-full w-full object-cover"
          alt={imagen.descripcion || ""}
        />
      )}

      {/* Badge: nueva */}
      {isNew && (
        <div className="absolute top-2 left-2 rounded-full bg-chart-2/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-chart-2">
          Nueva
        </div>
      )}

      {/* Deleted overlay */}
      {isDeleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-3 py-1 text-[11px] font-medium hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Restaurar
          </button>
        </div>
      )}

      {/* Action buttons: only when not deleted */}
      {!isDeleted && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Editar descripción"
            onClick={(e) => {
              e.stopPropagation();
              descripcionInputRef.current?.focus();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/60 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Eliminar imagen"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/60 hover:bg-background text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Descripcion footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/60 px-2 py-1.5">
        <input
          ref={descripcionInputRef}
          type="text"
          value={imagen.descripcion}
          onChange={(e) => onUpdateDescripcion(e.target.value)}
          maxLength={200}
          placeholder="Descripción"
          disabled={isDeleted}
          className="w-full bg-transparent text-[10px] text-foreground placeholder:text-muted-foreground/70 outline-none disabled:opacity-50"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};
