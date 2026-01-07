import { useRef, useCallback } from "react";
import { Image, Upload, Trash2, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "../../../../../services/api/getVentasLocales";
import { ImagenFormData } from "../types";
import dayjs from "dayjs";

// ============================================================================
// Types
// ============================================================================

interface ImagenesTabProps {
  imagenes: ImagenFormData[];
  onAdd: (files: File[]) => void;
  onUpdateDescripcion: (id: string, descripcion: string) => void;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}

// ============================================================================
// Sub-components
// ============================================================================

interface ImagenCardProps {
  imagen: ImagenFormData;
  onUpdateDescripcion: (descripcion: string) => void;
  onRemove: () => void;
  onRestore: () => void;
}

const ImagenCard = ({ imagen, onUpdateDescripcion, onRemove, onRestore }: ImagenCardProps) => {
  const isDeleted = imagen.isDeleted;
  const isNew = imagen.isNew;
  const imageUrl = imagen.previewUrl || getImageUrl(imagen.imgPath);

  return (
    <div
      className={`
        relative group border rounded-lg overflow-hidden transition-all
        ${isDeleted
          ? "opacity-50 border-red-300"
          : isNew
            ? "border-green-300 ring-2 ring-green-100"
            : "border-gray-200 hover:border-blue-300"
        }
      `}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={imageUrl}
          alt={imagen.imgDesc}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg==";
          }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isNew && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">
              Nueva
            </span>
          )}
          {isDeleted && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
              Eliminada
            </span>
          )}
        </div>

        {/* Actions overlay */}
        <div
          className={`
            absolute inset-0 bg-black/50 flex items-center justify-center gap-2
            transition-opacity
            ${isDeleted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
          `}
        >
          {isDeleted ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRestore}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restaurar
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <Input
          value={imagen.imgDesc}
          onChange={(e) => onUpdateDescripcion(e.target.value)}
          placeholder="Descripción de la imagen"
          disabled={isDeleted}
          className="text-sm h-8"
        />
        <p className="text-xs text-gray-400 mt-2">
          {dayjs(imagen.fechaSubida).format("DD/MM/YYYY HH:mm")}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Dropzone Component
// ============================================================================

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

const Dropzone = ({ onFilesSelected }: DropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onFilesSelected]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
      className="
        border-2 border-dashed border-gray-300 rounded-lg p-8
        hover:border-blue-400 hover:bg-blue-50/50
        transition-colors cursor-pointer
        flex flex-col items-center justify-center gap-3
      "
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
        <Upload className="h-6 w-6 text-blue-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          Arrastra imágenes aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PNG, JPG, JPEG hasta 10MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ImagenesTab = ({
  imagenes,
  onAdd,
  onUpdateDescripcion,
  onRemove,
  onRestore,
}: ImagenesTabProps) => {
  const activeImagenes = imagenes.filter((img) => !img.isDeleted);
  const deletedImagenes = imagenes.filter((img) => img.isDeleted);
  const newImagenes = imagenes.filter((img) => img.isNew && !img.isDeleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            Imágenes ({activeImagenes.length})
          </h3>
        </div>

        <div className="flex gap-2">
          {newImagenes.length > 0 && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              {newImagenes.length} nueva(s)
            </span>
          )}
          {deletedImagenes.length > 0 && (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              {deletedImagenes.length} eliminada(s)
            </span>
          )}
        </div>
      </div>

      {/* Dropzone */}
      <Dropzone onFilesSelected={onAdd} />

      {/* Grid de imágenes */}
      {imagenes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imagenes.map((imagen) => (
            <ImagenCard
              key={imagen.id}
              imagen={imagen}
              onUpdateDescripcion={(desc) => onUpdateDescripcion(imagen.id, desc)}
              onRemove={() => onRemove(imagen.id)}
              onRestore={() => onRestore(imagen.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Image className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay imágenes</p>
          <p className="text-sm text-gray-400">
            Arrastra o selecciona imágenes para agregarlas
          </p>
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Las imágenes eliminadas se quitarán permanentemente al guardar.
          Las nuevas imágenes se subirán al servidor.
        </p>
      </div>
    </div>
  );
};

export default ImagenesTab;
