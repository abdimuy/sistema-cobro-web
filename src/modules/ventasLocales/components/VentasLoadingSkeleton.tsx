import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface VentasLoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function VentasLoadingSkeleton({
  rows = 10,
  className,
}: VentasLoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-card overflow-hidden",
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/50">
            <TableHead className="w-[40px]">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-[140px]">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-[140px]">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="w-[120px]">
              <Skeleton className="h-4 w-10 ml-auto" />
            </TableHead>
            <TableHead className="w-[100px]">
              <Skeleton className="h-4 w-10" />
            </TableHead>
            <TableHead className="w-[90px]">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-[80px]">
              <Skeleton className="h-4 w-10" />
            </TableHead>
            <TableHead className="w-[120px]">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-6" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
