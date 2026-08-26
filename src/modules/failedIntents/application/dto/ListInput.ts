import type { IntentStatusValue } from "../../domain/values";

export type ListInput = {
  status?: IntentStatusValue;
  // modulo acota la lista a un módulo ("ventas", "pagos", …). Va al SERVIDOR,
  // no se filtra en memoria: la lista viene paginada, y recortar la página ya
  // recibida mostraría "las ventas que cupieron en los primeros veinte
  // renglones" sin que nada advirtiera del resto.
  //
  // Es una cadena libre a propósito — el catálogo de módulos vive en el API.
  modulo?: string;
  cursor?: string;
  pageSize?: number;
};
