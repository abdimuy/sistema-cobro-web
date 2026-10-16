import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";

// Errores de axios con la forma real que manda msp-api, para pasarlos por el
// mapper de cada módulo en las pruebas (no se inventa el DomainError a mano).
function conRespuesta(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = { status, statusText: "", data, headers: {}, config };
  return new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_RESPONSE", config, {}, response);
}

/** 403 de Huma por falta de desempeno:ver (auth.go): sin "code=". */
export const error403Huma = () =>
  conRespuesta(403, {
    title: "Forbidden",
    status: 403,
    detail: "permiso denegado",
    errors: [{ message: "el principal no tiene el permiso requerido", location: "header.authorization" }],
  });

/** 403 de writePlainError de cobranza/visitas: code=permiso_denegado. */
export const error403PermisoDenegado = () =>
  conRespuesta(403, {
    status: 403,
    title: "Forbidden",
    detail: "permiso denegado",
    errors: [{ message: "code=permiso_denegado" }],
  });

export const error500 = () =>
  conRespuesta(500, { title: "Internal Server Error", status: 500, detail: "ocurrió un error interno" });

export const errorDeRed = () => new AxiosError("Network Error", "ERR_NETWORK");
