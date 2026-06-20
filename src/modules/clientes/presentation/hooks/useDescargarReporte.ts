import { useCallback, useState } from "react";
import { useClientesPort } from "../context/ClientesContext";

// useDescargarReporte returns a trigger that fetches the client's PDF report and
// hands it to the browser as a download. Pass ventaIds to limit the report to
// specific sales; omit to cover all. isLoading covers the round-trip so the
// button can show progress. errors are swallowed into a flag; the caller decides
// how loud to be (a report is a low-stakes, retryable action).
export function useDescargarReporte(clienteId: number) {
  const port = useClientesPort();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const descargar = useCallback(
    async (ventaIds?: number[]) => {
      setIsLoading(true);
      setError(false);
      try {
        const blob = await port.descargarReporte(clienteId, ventaIds);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte-cliente-${clienteId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [port, clienteId],
  );

  return { descargar, isLoading, error };
}
