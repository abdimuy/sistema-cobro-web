import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VentasInfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  currentCount: number;
  className?: string;
}

export function VentasInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  currentCount,
  className,
}: VentasInfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div
      ref={observerRef}
      className={cn(
        "flex flex-col items-center justify-center py-6",
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando más...</span>
        </div>
      ) : hasMore ? (
        <div className="h-4" />
      ) : currentCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay más resultados
        </p>
      ) : null}
    </div>
  );
}
