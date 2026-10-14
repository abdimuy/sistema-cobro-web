import type { EstadoCuenta } from "../values/estadoCuenta";
import type { FormaCobro } from "./Actividad";

// Catalogos: valores con los que se arman los filtros de Actividad
// (GET /v2/desempeno/catalogos, contrato v2 §4b). El escritorio no copia
// catálogos: lo que no llega de aquí no se ofrece como filtro.
export type FormaCobroCatalogo = {
  readonly codigo: FormaCobro;
  readonly etiqueta: string;
};

// TipoVisitaCatalogo: `literal` es el valor exacto del filtro `tipo_visita`;
// `grupo` es la etiqueta corta del teléfono que agrupa varios literales.
export type TipoVisitaCatalogo = {
  readonly literal: string;
  readonly estado: EstadoCuenta;
  readonly grupo: string;
};

export type Catalogos = {
  readonly formasCobro: readonly FormaCobroCatalogo[];
  readonly tiposVisita: readonly TipoVisitaCatalogo[];
};
