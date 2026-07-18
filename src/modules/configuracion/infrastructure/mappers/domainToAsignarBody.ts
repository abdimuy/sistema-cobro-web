import type { AsignarVendedorInput } from "../../application/ports/ConfiguracionPort";
import type { AsignarVendedorBodyDTO } from "../http/dtos";

// domainToAsignarBody builds the PUT body. A field is included only when
// the caller set it (as `number` to assign or explicit `null` to clear);
// `undefined` (the default when a caller doesn't touch a slot) is omitted
// entirely so the backend leaves that slot untouched.
export function domainToAsignarBody(input: AsignarVendedorInput): AsignarVendedorBodyDTO {
  const body: AsignarVendedorBodyDTO = {};
  if (input.listaId1 !== undefined) body.vendedor_lista_id_1 = input.listaId1;
  if (input.listaId2 !== undefined) body.vendedor_lista_id_2 = input.listaId2;
  if (input.listaId3 !== undefined) body.vendedor_lista_id_3 = input.listaId3;
  return body;
}
