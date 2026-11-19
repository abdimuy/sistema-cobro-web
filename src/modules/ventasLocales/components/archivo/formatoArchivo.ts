import { enRelojDeNegocio } from "@/utils/tiempoDeNegocio";
import type { VentaArchivoDTO } from "@/services/api/getVentaArchivo";

// `2026-02-03T22:05:00Z` -> `03/02/2026 16:05` en hora de oficina. Un valor
// inválido no debe tumbar el panel: se pinta "—".
export function fechaHoraOficina(iso: string): string {
  try {
    const m = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/.exec(
      enRelojDeNegocio(iso),
    );
    return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : "—";
  } catch {
    return "—";
  }
}

export function direccionCompleta(
  v: Pick<
    VentaArchivoDTO,
    "direccion" | "numero_exterior" | "colonia" | "poblacion" | "ciudad"
  >,
): string {
  const calle = [v.direccion, v.numero_exterior]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");
  const partes = [calle, v.colonia, v.poblacion, v.ciudad]
    .map((p) => p.trim())
    .filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : "—";
}

export function lineaSoloConsulta(
  v: Pick<VentaArchivoDTO, "fecha_venta" | "capturada_por">,
): string {
  return `Venta del sistema anterior · solo consulta · capturada el ${fechaHoraOficina(v.fecha_venta)} por ${v.capturada_por}`;
}
