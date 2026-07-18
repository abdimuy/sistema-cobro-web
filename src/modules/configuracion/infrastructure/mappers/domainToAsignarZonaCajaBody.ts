import type { AsignarZonaCajaInput } from "../../application/ports/ConfiguracionPort";
import type { AsignarZonaCajaBodyDTO } from "../http/dtos";

// domainToAsignarZonaCajaBody builds the PUT body. Unlike vendedores'
// omit-vs-null convention, all 4 fields are always sent: the backend
// columns are NOT NULL, so a slot the admin leaves unassigned travels as
// the SIN_ASIGNAR_ID (-1) sentinel, never omitted.
export function domainToAsignarZonaCajaBody(
  input: AsignarZonaCajaInput,
): AsignarZonaCajaBodyDTO {
  return {
    caja_id: input.cajaId,
    cajero_id: input.cajeroId,
    vendedor_id: input.vendedorId,
    cobrador_id: input.cobradorId,
  };
}
