import { Skeleton } from "@/components/ui/skeleton";

// Mismas celdas y clases de alto que TableroFila: al llegar los datos nada
// salta (D23). Las clases de alto se comparan en la prueba de esqueleto.
export const ALTO_FILA_ESQUELETO = "py-3.5";
const CELDA = `border-y border-border bg-dsm-tarjeta px-2 ${ALTO_FILA_ESQUELETO} align-middle`;

export function FilaEsqueleto() {
  return (
    <tr data-testid="fila-esqueleto" aria-hidden>
      <td className={`${CELDA} max-w-[220px] rounded-l-[14px] border-l pl-[18px]`}>
        <Skeleton className="h-[21px] w-36" />
        <Skeleton className="mt-1 h-[13px] w-20" />
        <Skeleton className="mt-1 h-[13px] w-44" />
      </td>
      <td className={CELDA}>
        <Skeleton className="h-[19px] w-24" />
      </td>
      <td className={`${CELDA} w-[32%] min-w-[260px]`}>
        <Skeleton className="h-9 w-full" />
      </td>
      <td className={`${CELDA} text-right`}>
        <Skeleton className="ml-auto h-[19px] w-12" />
      </td>
      <td className={`${CELDA} text-right`}>
        <Skeleton className="ml-auto h-[19px] w-12" />
      </td>
      <td className={`${CELDA} text-right`}>
        <Skeleton className="ml-auto h-[19px] w-14" />
      </td>
      <td className={`${CELDA} text-right`}>
        <Skeleton className="ml-auto h-[19px] w-8" />
      </td>
      <td className={`${CELDA} min-w-[150px]`}>
        <Skeleton className="h-[19px] w-28" />
        <Skeleton className="mt-1.5 h-1.5 w-full" />
      </td>
      <td className={`${CELDA} rounded-r-[14px] border-r pr-[18px] text-right`}>
        <Skeleton className="ml-auto h-[19px] w-10" />
      </td>
    </tr>
  );
}
