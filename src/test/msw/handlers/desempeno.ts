import { http, HttpResponse } from "msw";
import {
  agendaDTO,
  catalogosDTO,
  cuentasDTO,
  fichaUsuarioDTO,
  imagenesDTO,
  jornadaDTO,
  paginaActividadDTO,
  tableroDTO,
  ultimosMovimientosDTO,
} from "../fixtures/desempeno";
import { listaTareasVaciaDTO } from "../fixtures/tareas";

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
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios/:uid`, ({ request }) => responder(fichaUsuarioDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios/:uid/jornada`, ({ request }) => responder(jornadaDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios/:uid/actividad`, ({ request }) =>
      responder(paginaActividadDTO, op, request),
    ),
    http.get(`${DESEMPENO_BASE}/desempeno/usuarios/:uid/cuentas`, ({ request }) => responder(cuentasDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/desempeno/ultimo-movimiento`, ({ request }) =>
      responder(ultimosMovimientosDTO, op, request),
    ),
    http.get(`${DESEMPENO_BASE}/desempeno/catalogos`, ({ request }) => responder(catalogosDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/cobranza/pagos/:id/imagenes`, ({ request }) => responder(imagenesDTO, op, request)),
    http.get(`${DESEMPENO_BASE}/visitas/agenda`, ({ request }) => responder(agendaDTO, op, request)),
    // Tareas de la zona (visitas P3): vacía por omisión y sin `vistoPor` ni
    // `error`, para no pisar la URL ni el error de la consulta que se prueba.
    http.get(`${DESEMPENO_BASE}/visitas/tareas`, () => HttpResponse.json(listaTareasVaciaDTO)),
    http.get(`${DESEMPENO_BASE}/visitas/:id/imagenes`, ({ request }) => responder(imagenesDTO, op, request)),
  ];
}
