import { Skeleton } from "@/components/ui/skeleton";

export const VentaDetalleSkeleton = () => (
  <div className="flex flex-col gap-8 p-8">
    <div className="flex items-start justify-between gap-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3 text-right">
        <Skeleton className="ml-auto h-3 w-20" />
        <Skeleton className="ml-auto h-14 w-48" />
      </div>
    </div>
    <Skeleton className="h-20 w-full" />
    <div className="space-y-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

export default VentaDetalleSkeleton;
