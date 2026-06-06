import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DropzoneTileProps {
  onFilesSelected: (files: File[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DropzoneTile = ({ onFilesSelected }: DropzoneTileProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length > 0) onFilesSelected(files);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length > 0) onFilesSelected(files);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex aspect-square flex-col items-center justify-center gap-2",
          "rounded-lg border border-dashed border-border/60 bg-card text-muted-foreground",
          "transition-colors hover:border-foreground/40 hover:text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-foreground/20 cursor-pointer",
          isDraggingOver && "border-foreground/40 text-foreground bg-muted/30",
        )}
      >
        <Upload className="h-6 w-6" />
        <span className="text-[11px]">Agregar imagen</span>
      </button>
    </>
  );
};
