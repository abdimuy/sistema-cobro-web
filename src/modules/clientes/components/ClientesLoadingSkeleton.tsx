import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  rows?: number;
  className?: string;
}

// Column proportions matching: score, cliente, zona, telefono, estadoPago, segmento, saldo, recencia
const SKELETON_COLUMNS = [
  { width: "w-[80px]", align: "center" as const },
  { width: "min-w-[200px] flex-1", align: "left" as const },
  { width: "w-[90px]", align: "left" as const },
  { width: "w-[120px]", align: "left" as const },
  { width: "w-[140px]", align: "left" as const },
  { width: "w-[170px]", align: "left" as const },
  { width: "w-[110px]", align: "right" as const },
  { width: "w-[100px]", align: "right" as const },
];

export function ClientesLoadingSkeleton({ rows = 10, className }: Props) {
  return (
    <div
      className={cn("w-full rounded-md border border-border/40 overflow-hidden", className)}
      aria-busy="true"
      aria-label="Cargando clientes"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-muted/30">
        {SKELETON_COLUMNS.map((col, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              col.width,
              col.align === "right" && "justify-end",
              col.align === "center" && "justify-center"
            )}
          >
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            "flex items-center gap-2 px-3 h-10 border-b border-border/20 last:border-b-0",
            rowIndex % 2 === 1 && "bg-muted/20"
          )}
        >
          {/* Score — circular chip */}
          <div className={cn("flex justify-center", SKELETON_COLUMNS[0].width)}>
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>

          {/* Cliente name — longer */}
          <div className={cn("flex", SKELETON_COLUMNS[1].width)}>
            <Skeleton
              className="h-3.5"
              style={{ width: `${55 + ((rowIndex * 17) % 35)}%` }}
            />
          </div>

          {/* Zona */}
          <div className={cn("flex", SKELETON_COLUMNS[2].width)}>
            <Skeleton className="h-3 w-3/4" />
          </div>

          {/* Teléfono */}
          <div className={cn("flex", SKELETON_COLUMNS[3].width)}>
            <Skeleton className="h-3 w-4/5" />
          </div>

          {/* Estado pago — badge-shaped */}
          <div className={cn("flex", SKELETON_COLUMNS[4].width)}>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>

          {/* Segmento — badge-shaped */}
          <div className={cn("flex", SKELETON_COLUMNS[5].width)}>
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>

          {/* Saldo — right aligned */}
          <div className={cn("flex justify-end", SKELETON_COLUMNS[6].width)}>
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Recencia — right aligned */}
          <div className={cn("flex justify-end", SKELETON_COLUMNS[7].width)}>
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
