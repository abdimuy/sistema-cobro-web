import { MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEsPantallaAngosta } from "../../presentation/hooks/lib/useEsPantallaAngosta";

export function ErrorConReintento({
  titulo,
  mensaje,
  onReintentar,
}: {
  titulo: string;
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-[14px] bg-dsm-tarjeta px-6 py-12 text-center">
      <p className="font-serif text-xl">{titulo}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{mensaje}</p>
      <Button variant="outline" size="sm" className="rounded-full" onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  );
}

export function EstadoVacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
      <p className="font-serif text-xl">{titulo}</p>
      {detalle && <p className="text-sm text-muted-foreground">{detalle}</p>}
    </div>
  );
}

export function AvisoPantallaAngosta() {
  const angosta = useEsPantallaAngosta();
  if (!angosta) return null;
  return (
    <div role="status" className="flex items-center gap-2 rounded-full bg-dsm-ambar-fondo px-4 py-2 text-xs text-dsm-ambar">
      <MonitorSmartphone aria-hidden className="h-3.5 w-3.5" />
      Ventana angosta: ensánchala para leer la línea del día completa
    </div>
  );
}

export function FilasCargando({ filas, columnas }: { filas: number; columnas: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, i) => (
        <tr key={i} data-testid="fila-cargando">
          {Array.from({ length: columnas }).map((__, j) => (
            <td key={j} className="px-2 py-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
