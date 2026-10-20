import { esUno } from "../values/esUno";

// Tarea de visita que la oficina asigna a una venta (visitas P3, spec §6).
// El id lo genera el escritorio al abrir el formulario (idempotencia: doble
// clic o reintento = la misma tarea). El estado lo deriva el servidor (§6.3) y
// aquí solo se pinta.
export const ESTADOS_TAREA = ["pendiente", "atendida", "no_atendida", "cancelada"] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export const esEstadoTarea = (v: unknown): v is EstadoTarea => esUno(ESTADOS_TAREA, v);

export const TIPOS_ATENCION = ["pago", "visita"] as const;
export type TipoAtencion = (typeof TIPOS_ATENCION)[number];
export const esTipoAtencion = (v: unknown): v is TipoAtencion => esUno(TIPOS_ATENCION, v);

export const LIMITE_NOTA_TAREA = 500;

export type Tarea = {
  readonly id: string;
  readonly ventaId: number;
  readonly clienteId: number;
  readonly zonaClienteId: number;
  // Día civil "AAAA-MM-DD" y hora civil "HH:MM".
  readonly fecha: string;
  readonly hora: string | null;
  readonly nota: string | null;
  readonly reemplazaA: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly canceladaAt: string | null;
};

// Lo primero que atendió la tarea: un pago o una visita posterior a la
// asignación (spec §6.3).
export type AtendidaPor = {
  readonly tipo: TipoAtencion;
  readonly id: string;
  readonly cobradorId: number | null;
  readonly instante: string;
};

export type TareaConEstado = Tarea & {
  readonly estado: EstadoTarea;
  readonly atendidaPor: AtendidaPor | null;
};

// Cuerpo de POST /v2/visitas/tareas. `reemplazaA` = editar (cancela la vieja
// y asigna esta en la misma transacción del servidor).
export type NuevaTarea = {
  readonly id: string;
  readonly ventaId: number;
  readonly fecha: string;
  readonly hora: string | null;
  readonly nota: string | null;
  readonly reemplazaA: string | null;
};
