import { useState } from "react";
import { DropzoneTile } from "../piezas/DropzoneTile";
import { ImagenTileEditable } from "../piezas/ImagenTileEditable";
import { VentaImagenLightbox } from "../../detalle/VentaImagenLightbox";
import type { ImagenV2 } from "@/services/api/ventaV2Types";
import type {
  ImagenFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImagenesTabProps {
  ventaId: string;
  imagenes: ImagenFormData[];
  errors: ValidationError[];
  onAdd: (files: File[]) => void;
  onUpdateDescripcion: (id: string, descripcion: string) => void;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ExistingImagen = Extract<ImagenFormData, { kind: "existing" }>;

/** Returns the index of `img` within the filtered (existing, non-deleted) list. */
const existingImagesIndex = (img: ImagenFormData, all: ImagenFormData[]): number => {
  const filtered = all.filter(
    (i): i is ExistingImagen => i.kind === "existing" && !i.isDeleted,
  );
  return filtered.findIndex((i) => i.id === img.id);
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ImagenesTab = ({
  ventaId,
  imagenes,
  onAdd,
  onUpdateDescripcion,
  onRemove,
  onRestore,
}: ImagenesTabProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeCount = imagenes.filter(
    (img) => !(img.kind === "existing" && img.isDeleted),
  ).length;

  // Build the ImagenV2[] for the lightbox (existing, non-deleted only)
  const existingImagenesAsV2: ImagenV2[] = imagenes
    .filter((img): img is ExistingImagen => img.kind === "existing" && !img.isDeleted)
    .map((img) => ({
      id: img.id,
      storage_kind: "local",
      storage_key: img.storageKey,
      mime: img.mime,
      size_bytes: 0,
      descripcion: img.descripcion || null,
      created_at: img.createdAt,
      updated_at: img.createdAt,
      created_by: "",
      updated_by: "",
    }));

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      {/* Header */}
      <div className="border-b border-border/60 px-5 py-3 flex items-center">
        <h3 className="font-serif text-lg font-normal text-foreground">
          Imágenes
        </h3>
        <span className="ml-2 font-mono text-[10px] text-muted-foreground/70">
          {activeCount}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter((f) =>
              f.type.startsWith("image/"),
            );
            if (files.length > 0) onAdd(files);
          }}
        >
          <DropzoneTile onFilesSelected={onAdd} />
          {imagenes.map((img) => (
            <ImagenTileEditable
              key={img.id}
              imagen={img}
              ventaId={ventaId}
              onUpdateDescripcion={(d) => onUpdateDescripcion(img.id, d)}
              onRemove={() => onRemove(img.id)}
              onRestore={() => onRestore(img.id)}
              onClickPreview={
                img.kind === "existing" && !img.isDeleted
                  ? () => {
                      const idx = existingImagesIndex(img, imagenes);
                      if (idx >= 0) setLightboxIndex(idx);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && existingImagenesAsV2.length > 0 && (
        <VentaImagenLightbox
          ventaId={ventaId}
          imagenes={existingImagenesAsV2}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};
