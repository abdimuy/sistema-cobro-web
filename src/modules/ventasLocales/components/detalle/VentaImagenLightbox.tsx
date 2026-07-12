import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  RefreshCw,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import AuthenticatedImage from "./AuthenticatedImage";
import { ImagenV2 } from "@/services/api/ventaV2Types";

interface Props {
  ventaId: string;
  imagenes: ImagenV2[];
  initialIndex: number;
  onClose: () => void;
}

const calcOptimal = (img: HTMLImageElement, rot: number): number => {
  const vw = window.innerWidth * 0.9;
  const vh = window.innerHeight * 0.85;
  const rotated = rot === 90 || rot === 270;
  const w = rotated ? img.naturalHeight : img.naturalWidth;
  const h = rotated ? img.naturalWidth : img.naturalHeight;
  return Math.min(vw / w, vh / h);
};

export const VentaImagenLightbox = ({ ventaId, imagenes, initialIndex, onClose }: Props) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % imagenes.length),
    [imagenes.length]
  );
  const prev = useCallback(
    () => setIndex((i) => (i === 0 ? imagenes.length - 1 : i - 1)),
    [imagenes.length]
  );

  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
    setImgEl(null);
  }, [index]);

  const reset = () => {
    if (imgEl) setZoom(calcOptimal(imgEl, rotation));
    else setZoom(1);
    setPos({ x: 0, y: 0 });
  };

  const rotL = () => {
    setRotation((r) => {
      const next = (r - 90 + 360) % 360;
      if (imgEl) setZoom(calcOptimal(imgEl, next));
      setPos({ x: 0, y: 0 });
      return next;
    });
  };

  const rotR = () => {
    setRotation((r) => {
      const next = (r + 90) % 360;
      if (imgEl) setZoom(calcOptimal(imgEl, next));
      setPos({ x: 0, y: 0 });
      return next;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Capture phase + stopPropagation so the venta's Radix Dialog (which
        // also closes on Escape) never sees it — Escape closes only the
        // lightbox, not the modal underneath.
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.2, 5));
      else if (e.key === "-") setZoom((z) => Math.max(z - 0.2, 0.1));
      else if (e.key === "r" || e.key === "R") rotR();
      else if (e.key === "l" || e.key === "L") rotL();
      else if (e.key === "0") reset();
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [next, prev, onClose, imgEl, rotation]);

  useEffect(() => {
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) =>
        e.deltaY < 0 ? Math.min(z + 0.1, 5) : Math.max(z - 0.1, 0.1)
      );
    };
    document.addEventListener("wheel", wheel, { passive: false });
    return () => document.removeEventListener("wheel", wheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setDragging(true);
      setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging) setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  const current = imagenes[index];

  return (
    <div
      // data-lightbox marks this layer so the venta's Radix DialogContent can
      // ignore interactions here (see VentaDetalleModal onInteractOutside): the
      // lightbox is portaled to <body>, outside the dialog, so without this a
      // click on its backdrop would be treated as "outside" and close the venta
      // modal underneath.
      data-lightbox=""
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in-0"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      // Click on the empty backdrop (not the image or a toolbar) closes only
      // the lightbox.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
        <Tool onClick={() => setZoom((z) => Math.max(z - 0.2, 0.1))} title="Zoom out (-)">
          <Minus className="h-3.5 w-3.5" />
        </Tool>
        <span className="min-w-[44px] text-center font-mono text-[11px] tabular text-white/80">
          {Math.round(zoom * 100)}%
        </span>
        <Tool onClick={() => setZoom((z) => Math.min(z + 0.2, 5))} title="Zoom in (+)">
          <Plus className="h-3.5 w-3.5" />
        </Tool>
        <Tool onClick={reset} title="Reset (0)">
          <RefreshCw className="h-3.5 w-3.5" />
        </Tool>
        <span className="mx-1 h-3 w-px bg-white/20" />
        <Tool onClick={rotL} title="Rotar izquierda (L)">
          <RotateCcw className="h-3.5 w-3.5" />
        </Tool>
        <span className="min-w-[36px] text-center font-mono text-[11px] tabular text-white/80">
          {rotation}°
        </span>
        <Tool onClick={rotR} title="Rotar derecha (R)">
          <RotateCw className="h-3.5 w-3.5" />
        </Tool>
      </div>

      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>

      {imagenes.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 font-mono text-[11px] tabular text-white/80 backdrop-blur">
            {index + 1} / {imagenes.length}
          </div>
        </>
      )}

      {current && (
        <div className="absolute bottom-4 right-4 z-20 max-w-xs rounded-lg bg-white/10 p-3 text-white backdrop-blur">
          {current.descripcion && (
            <p className="text-xs font-medium">{current.descripcion}</p>
          )}
          <p className="mt-1 font-mono text-[10px] text-white/60">
            {dayjs(current.created_at).format("DD MMM YYYY · HH:mm")}
          </p>
        </div>
      )}

      <div
        className="flex items-center justify-center"
        onMouseDown={onMouseDown}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `rotate(${rotation}deg) scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)`,
          transformOrigin: "center",
          transition: dragging ? "none" : "transform 150ms ease-out",
        }}
      >
        {current && (
          <AuthenticatedImage
            ventaId={ventaId}
            imagenId={current.id}
            alt={current.descripcion ?? "imagen"}
            className={`max-w-none select-none rounded-md ${
              zoom > 1 ? "cursor-move" : "cursor-default"
            }`}
            onLoad={(el) => {
              setImgEl(el);
              setZoom(calcOptimal(el, rotation));
            }}
          />
        )}
      </div>

    </div>
  );
};

const Tool = ({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white"
  >
    {children}
  </button>
);

export default VentaImagenLightbox;
