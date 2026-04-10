import React, { useState, useCallback } from "react";
import { ImageGarantia } from "../../services/api/getImagesByGarantia";
import { URL_API } from "../../constants/api";
import {
  Dialog,
  DialogContent,
} from "../../components/ui/dialog";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

interface GarantiaImageGalleryProps {
  images: ImageGarantia[];
  loading: boolean;
  /** Optional: allow opening from external source (e.g. timeline image click) */
  externalOpenUrl?: string | null;
  onExternalClose?: () => void;
}

const GarantiaImageGallery: React.FC<GarantiaImageGalleryProps> = ({
  images,
  loading,
  externalOpenUrl,
  onExternalClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const allUrls = images.map((img) => `${URL_API}${img.IMG_PATH}`);

  // Handle external image open
  const isExternalOpen = externalOpenUrl !== null && externalOpenUrl !== undefined;
  const externalIndex = isExternalOpen
    ? allUrls.indexOf(externalOpenUrl!)
    : -1;

  const isOpen = selectedIndex !== null || isExternalOpen;
  const currentIndex =
    selectedIndex !== null
      ? selectedIndex
      : externalIndex >= 0
      ? externalIndex
      : 0;
  const currentUrl = isExternalOpen && externalIndex < 0
    ? externalOpenUrl!
    : allUrls[currentIndex];
  const canNavigate = isExternalOpen && externalIndex < 0 ? false : true;

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
    onExternalClose?.();
  }, [onExternalClose]);

  const handlePrev = useCallback(() => {
    if (!canNavigate) return;
    const newIndex = (currentIndex - 1 + allUrls.length) % allUrls.length;
    setSelectedIndex(newIndex);
    onExternalClose?.();
  }, [currentIndex, allUrls.length, canNavigate, onExternalClose]);

  const handleNext = useCallback(() => {
    if (!canNavigate) return;
    const newIndex = (currentIndex + 1) % allUrls.length;
    setSelectedIndex(newIndex);
    onExternalClose?.();
  }, [currentIndex, allUrls.length, canNavigate, onExternalClose]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0 && !isExternalOpen) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sin imagenes</p>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <button
            key={img.ID}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden border border-border group"
          >
            <img
              src={`${URL_API}${img.IMG_PATH}`}
              alt={img.IMG_DESC || `Imagen ${img.ID}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur-sm border-border">
          <div className="relative flex items-center justify-center min-h-[400px]">
            {canNavigate && allUrls.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 z-10 p-2 rounded-full bg-background/80 hover:bg-background border border-border text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {currentUrl && (
              <img
                src={currentUrl}
                alt="Imagen de garantia"
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
              />
            )}

            {canNavigate && allUrls.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 z-10 p-2 rounded-full bg-background/80 hover:bg-background border border-border text-foreground transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {canNavigate && allUrls.length > 1 && (
            <div className="text-center text-sm text-muted-foreground pb-2">
              {currentIndex + 1} / {allUrls.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GarantiaImageGallery;
