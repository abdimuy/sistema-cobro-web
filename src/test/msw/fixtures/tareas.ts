import type { ListaTareasDTO, TareaConEstadoDTO, TareaDTO } from "@/modules/desempeno/infrastructure/http/dtos";
import listarGolden from "./goldens-servidor/tareas-listar.golden.json";
import cancelarGolden from "./goldens-servidor/tareas-cancelar.golden.json";
import crearGolden from "./goldens-servidor/tareas-crear.golden.json";

// Fixtures del contrato de tareas de visita: son los goldens del SERVIDOR
// (ver goldens-servidor/README.md), no JSON escrito a mano. Las pruebas los
// pasan por el mismo adaptador y mapper que usa producción. La lista golden
// (zona 7) trae los casos: no_atendida, atendida por pago con nombre, atendida
// sin hora ni cobrador, atendida sin nombre, atendida por visita, pendiente,
// cancelada y su reemplazo.
//
// Hora de la oficina: CDMX es UTC-6 (14:05Z = 08:05).

const lista = (listarGolden as unknown as ListaTareasDTO).items;
const porId = (n: number): TareaConEstadoDTO => {
  const t = lista.find((x) => x.id.endsWith(String(n).padStart(12, "0")));
  if (!t) throw new Error(`el golden de tareas no trae la tarea ${n}`);
  return t;
};

export const tareaConEstadoNoAtendidaDTO = porId(7);
export const tareaConEstadoAtendidaDTO = porId(3); // pago, con cobrador e instante
export const tareaConEstadoAtendidaSinHoraNiCobradorDTO = porId(4); // instante y cobrador null
export const tareaConEstadoAtendidaSinNombreDTO = porId(5); // cobrador_id sin nombre
export const tareaConEstadoAtendidaPorVisitaDTO = porId(6);
export const tareaConEstadoPendienteDTO = porId(1);
export const tareaConEstadoCanceladaDTO = porId(2);
export const tareaConEstadoReemplazoDTO = porId(8);

export const ZONA_TAREAS = tareaConEstadoPendienteDTO.zona_cliente_id;
export const VENTA_TAREA = tareaConEstadoPendienteDTO.venta_id;

// Respuestas de POST /tareas y POST /tareas/{id}/cancelar.
export const tareaCreadaDTO = crearGolden as unknown as TareaDTO;
export const tareaCanceladaDTO = cancelarGolden as unknown as TareaDTO;
// La tarea pendiente tal como la lista (sin estado ni atendida_por).
export const tareaPendienteDTO: TareaDTO = Object.fromEntries(
  Object.entries(tareaConEstadoPendienteDTO).filter(([k]) => k !== "estado" && k !== "atendida_por"),
) as TareaDTO;

export const listaTareasDTO: ListaTareasDTO = { items: lista };

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
