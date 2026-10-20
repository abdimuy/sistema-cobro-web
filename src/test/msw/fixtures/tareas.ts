import type { ListaTareasDTO, TareaConEstadoDTO, TareaDTO } from "@/modules/desempeno/infrastructure/http/dtos";

// Fixtures del contrato de tareas de visita (visitas P3, Tarea 5 del plan).
// Armados a mano desde el contrato mientras el servidor no existe: cuando la
// Tarea 8 publique los goldens (internal/visitas/infra/visitashttp/testdata/
// tareas-*.golden.json) se reemplaza ESTE archivo por ellos sin tocar las
// pruebas, que solo importan los nombres de aquí.
//
// Día de referencia: 14-oct-2026. CDMX es UTC-6: 16:31Z = 10:31 en la oficina.

export const ZONA_TAREAS = 21563;
export const VENTA_TAREA = 13785217;

export const tareaPendienteDTO: TareaDTO = {
  id: "3f9c2b1e-7a44-4d0e-9b6a-1c2d3e4f5a60",
  venta_id: VENTA_TAREA,
  cliente_id: 48211,
  zona_cliente_id: ZONA_TAREAS,
  fecha: "2026-10-15",
  hora: "11:00",
  nota: "llevar estado de cuenta",
  reemplaza_a: null,
  created_at: "2026-10-14T15:05:12.123456Z",
  created_by: "8d1e5a2c-0b7f-4c39-a6e4-2f1b9c8d7e65",
  updated_at: "2026-10-14T15:05:12.123456Z",
  cancelada_at: null,
};

export const tareaCanceladaDTO: TareaDTO = {
  ...tareaPendienteDTO,
  updated_at: "2026-10-14T16:20:00.5Z",
  cancelada_at: "2026-10-14T16:20:00.5Z",
};

export const tareaConEstadoPendienteDTO: TareaConEstadoDTO = {
  ...tareaPendienteDTO,
  estado: "pendiente",
  atendida_por: null,
};

export const tareaConEstadoAtendidaDTO: TareaConEstadoDTO = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  venta_id: 13790011,
  cliente_id: 51307,
  zona_cliente_id: ZONA_TAREAS,
  fecha: "2026-10-13",
  hora: null,
  nota: null,
  reemplaza_a: null,
  created_at: "2026-10-12T21:00:00Z",
  created_by: "8d1e5a2c-0b7f-4c39-a6e4-2f1b9c8d7e65",
  updated_at: "2026-10-12T21:00:00Z",
  cancelada_at: null,
  estado: "atendida",
  atendida_por: {
    tipo: "pago",
    id: "c7d8e9f0-1a2b-4c3d-9e4f-5a6b7c8d9e0f",
    cobrador_id: 47,
    instante: "2026-10-14T16:31:00Z",
  },
};

export const tareaConEstadoCanceladaDTO: TareaConEstadoDTO = {
  ...tareaCanceladaDTO,
  id: "5e6f7a8b-9c0d-4e1f-a2b3-c4d5e6f7a8b9",
  venta_id: 13801234,
  cliente_id: 50122,
  estado: "cancelada",
  atendida_por: null,
};

export const tareaConEstadoNoAtendidaDTO: TareaConEstadoDTO = {
  id: "0f1e2d3c-4b5a-4968-8776-655443322110",
  venta_id: 13755555,
  cliente_id: 47001,
  zona_cliente_id: ZONA_TAREAS,
  fecha: "2026-09-28",
  hora: "09:30",
  nota: null,
  reemplaza_a: null,
  created_at: "2026-09-27T18:00:00Z",
  created_by: "8d1e5a2c-0b7f-4c39-a6e4-2f1b9c8d7e65",
  updated_at: "2026-09-27T18:00:00Z",
  cancelada_at: null,
  estado: "no_atendida",
  atendida_por: null,
};

export const listaTareasDTO: ListaTareasDTO = {
  items: [
    tareaConEstadoPendienteDTO,
    tareaConEstadoAtendidaDTO,
    tareaConEstadoCanceladaDTO,
    tareaConEstadoNoAtendidaDTO,
  ],
};

// Errores con la forma de Huma de msp-api: el código va en errors[].message
// como "code=<codigo>" (lib/codigoDeError.ts) y el mensaje en `detail`.
function errorHuma(status: number, codigo: string, detalle: string) {
  return { title: "Unprocessable Entity", status, detail: detalle, errors: [{ message: `code=${codigo}` }] };
}

export const errorTareaFechaPasada = errorHuma(422, "tarea_fecha_pasada", "la fecha de la tarea ya pasó");
export const errorTareaContenidoDistinto = errorHuma(
  422,
  "tarea_contenido_distinto",
  "esta tarea ya existe con otros datos",
);
export const errorTareaNoEncontrada = { ...errorHuma(404, "tarea_no_encontrada", "la tarea no existe"), title: "Not Found" };
export const errorSinPermisoTareas = {
  title: "Forbidden",
  status: 403,
  detail: "no tienes permiso para esta acción",
  errors: [{ message: "code=permission_denied" }],
};

export const listaTareasVaciaDTO: ListaTareasDTO = { items: [] };
