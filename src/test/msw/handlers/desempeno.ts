import { http, HttpResponse } from "msw";
import {
  catalogosDTO,
  cuentasDTO,
  imagenesDTO,
  jornadaDTO,
  paginaActividadDTO,
  tableroDTO,
} from "../fixtures/desempeno";

export const DESEMPENO_BASE = "*/v2";

type Opciones = {
  vistoPor?: (url: URL) => void;
  error?: { status: number; body: Record<string, unknown> };
};

function responder<T>(cuerpo: T, op: Opciones, request: Request) {
  op.vistoPor?.(new URL(request.url));
  if (op.error) return HttpResponse.json(op.error.body, { status: op.error.status });
  return HttpResponse.json(cuerpo as Record<string, unknown>);
}

// Handlers de /v2/desempeno/* y de las fotos (contrato v2 §2–§6). Las pruebas
// los registran con server.use(...desempenoHandlers({...})).
export function desempenoHandlers(op: Opciones = {}) {
  return [
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios`, ({ request }) => responder(tableroDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios/:uid/jornada`, ({ request }) => responder(jornadaDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios/:uid/actividad`, ({ request }) =>
      responder(paginaActividadDTO, op, request),
    ),
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios/:uid/cuentas`, ({ request }) => responder(cuentasDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/desempeno/catalogos`, ({ request }) => responder(catalogosDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/cobranza/pagos/:id/imagenes`, ({ request }) => responder(imagenesDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/visitas/:id/imagenes`, ({ request }) => responder(imagenesDTO, op, request)),
  ];
}
