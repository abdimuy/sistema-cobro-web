// DTOs de /v2/desempeno/* — nombres JSON EXACTOS del contrato v2.2 (§8)
// (docs/superpowers/specs/2026-10-14-desempeno-contratos.md en msp-api).
// Los enums llegan como string y el mapper los valida. `null` explícito: el
// API nunca omite un campo (contrato §0), salvo `descripcion` de las fotos.

export type ConteoDTO = { n: number; importe: string };

export type RegistradoPorDTO = {
  usuario_uid: string | null;
  cobrador_id: number | null;
  nombre: string;
  origen: string;
};

export type PagoActividadDTO = {
  importe: string;
  forma_cobro: string;
  // msp-api desempenohttp/dto.go:20 es *int: llega null cuando el pago no trae forma.
  forma_cobro_id: number | null;
  aplicado: boolean;
  rechazado: boolean;
  docto_cc_id: number | null;
  pago_recibido_id: string | null;
};

export type VisitaActividadDTO = {
  visita_id: string;
  tipo_visita: string;
  nota: string | null;
  estado: string;
  trato: string;
  etiqueta: string;
};

export type ActividadDTO = {
  id: string;
  tipo: string;
  hora: string;
  recibido_at: string | null;
  cliente_id: number;
  cliente_nombre: string;
  venta_id: number | null;
  folio: string | null;
  registrado_por: RegistradoPorDTO;
  lat: number | null;
  lng: number | null;
  con_gps: boolean;
  num_fotos: number;
  docto_pv_id: number | null;
  captura_tardia: boolean;
  pago: PagoActividadDTO | null;
  visita: VisitaActividadDTO | null;
};

export type PausaDTO = {
  desde: string;
  hasta: string;
  minutos: number;
  anterior_id: string | null;
  siguiente_id: string | null;
  en_curso: boolean;
};

export type TramoDTO = {
  desde: string;
  hasta: string;
  pagos: ConteoDTO;
  visitas: number;
  condonaciones: number;
  clientes: number;
};

export type HoraDTO = { hora: number; pagos: number; visitas: number; condonaciones: number; importe: string };

// Punto de la línea con los datos de su popover (contrato v2): `importe` null
// en visitas, `resultado` (literal) null en pagos y condonaciones.
export type PuntoDTO = {
  id: string;
  tipo: string;
  hora: string;
  cliente_nombre: string;
  importe: string | null;
  resultado: string | null;
  num_fotos: number;
};

export type LineaDelDiaDTO = {
  dia: string;
  puntos: PuntoDTO[];
  tramos: TramoDTO[];
  por_hora: HoraDTO[];
  pausas: PausaDTO[];
};

export type SenalDTO = {
  tipo: string;
  actividad_ids: string[];
  desde: string | null;
  hasta: string | null;
  detalle: string;
  regla: string;
};

export type ResumenPausasDTO = { n: number; minutos: number; en_curso: boolean };

export type EjeDTO = { desde_hora: number; hasta_hora: number };

export type UltimoMovimientoDTO = { id: string; tipo: string; hora: string };

export type PromedioDiarioDTO = { dias: number; minutos_activos: number; pagos_importe: string; visitas: number };

export type UsuarioTableroDTO = {
  uid: string;
  nombre: string;
  email: string;
  zona_id: number | null;
  zona_nombre: string | null;
  configurado: boolean;
  motivo_no_configurado: string | null;
  inicio_semana: string | null;
  ventas_universo: number;
  estado_ahora: string;
  estado_desde: string | null;
  ultima: { id: string; tipo: string; hora: string; cliente_nombre: string } | null;
  primera_actividad: string | null;
  ultima_actividad: string | null;
  minutos_activos: number;
  pausas: ResumenPausasDTO;
  pagos: ConteoDTO;
  pagos_por_forma: { efectivo: ConteoDTO; transferencia: ConteoDTO; cheque: ConteoDTO };
  condonaciones: ConteoDTO;
  no_aplicados: ConteoDTO;
  visitas: number;
  cobertura: { con_algo: number; total: number };
  semana_vencida: boolean;
  // Contrato pulido 2 (ultimo_movimiento): en el TABLERO se calcula sólo con
  // 1 y 7 días y `null` = "nada en 7 días; la fecha de 92 días se pide aparte"
  // (nunca "sin movimiento en 92 días"). En la FICHA se calcula con 1, 7 y 92
  // días y `null` = "sin movimiento en 92 días". El mapper los separa.
  ultimo_movimiento: UltimoMovimientoDTO | null;
  cobertura_por_columna: { por_visitar: number; no_paga: number; pagados: number; sin_nada: number };
  promedio_diario: PromedioDiarioDTO | null;
  cobro: { cobrado: string; esperado: string; falta: string; pct: string | null };
  lineas: LineaDelDiaDTO[];
};

export type TableroDTO = {
  generado_at: string;
  hoy: string;
  eje: EjeDTO;
  periodo: string;
  pausa_min: number;
  usuarios: UsuarioTableroDTO[];
};

// GET /v2/desempeno/usuarios/{uid} (contrato v2.2 §8).
export type FichaUsuarioDTO = {
  generado_at: string;
  hoy: string;
  periodo: string;
  pausa_min: number;
  eje: EjeDTO;
  usuario: UsuarioTableroDTO;
  inicio_semana_dia: string | null;
  dias_navegables: string[];
};

// GET /v2/desempeno/ultimo-movimiento?contrato=2.2&uids=a,b (contrato pulido 2
// §3). Entre 1 y 100 uids, separados por coma. Mismo cálculo que la ficha (1, 7
// y 92 días): `null` = "sin movimiento en 92 días". Un uid inexistente, no
// configurado o de zona excluida no aparece en `usuarios`. El orden es el de
// `uids`, sin repetidos.
export type UltimoMovimientoLoteDTO = { uid: string; ultimo_movimiento: UltimoMovimientoDTO | null };

export type UltimosMovimientosDTO = {
  generado_at: string;
  usuarios: UltimoMovimientoLoteDTO[];
};

export type JornadaDTO = {
  uid: string;
  fecha: string;
  pausa_min: number;
  generado_at: string;
  hoy: string;
  eje: EjeDTO;
  horario: { desde_hora: string; hasta_hora: string } | null;
  actividades: ActividadDTO[];
  linea: LineaDelDiaDTO;
  senales: SenalDTO[];
  resumen: {
    primera_actividad: string | null;
    ultima_actividad: string | null;
    minutos_activos: number;
    pausas: ResumenPausasDTO;
    pagos: ConteoDTO;
    visitas: number;
    condonaciones: ConteoDTO;
    clientes: number;
  };
};

export type PaginaActividadDTO = {
  items: ActividadDTO[];
  siguiente_cursor: string | null;
  totales: { n: number; importe: string; por_tipo: { pago: number; visita: number; condonacion: number } };
};

export type CuentaDTO = {
  venta_id: number;
  docto_pv_id: number | null;
  folio: string | null;
  cliente_id: number;
  cliente_nombre: string;
  producto: string | null;
  estado: string;
  trato: string;
  etiqueta: string;
  detalle: string;
  columna: string;
  con_algo: boolean;
  determinado_por: string | null;
  ultima_actividad: { id: string; tipo: string; hora: string } | null;
  saldo: string;
  parcialidad: string;
  abono_semana: string;
  num_atrasos: number;
  nueva: boolean;
};

export type CuentasDTO = {
  inicio_semana: string;
  conteos: { por_visitar: number; no_paga: number; pagados: number; sin_nada: number; total: number };
  cuentas: CuentaDTO[];
};

// GET /v2/visitas/agenda?zona_id=&hoy= (visitas P2, spec §5.5; msp-api
// internal/visitas/infra/visitashttp/dto_agenda.go). Un item por venta con
// compromiso; `estado` y `columna` los deriva el servidor. La nota de la visita
// no viaja aquí.
export type CompromisoAgendaDTO = {
  venta_id: number;
  visita_id: string;
  tipo: string;
  estado: string;
  dia: string;
  hora: string | null;
  monto_centavos: number | null;
  columna: string;
};

export type AgendaDTO = {
  zona_id: number;
  hoy: string;
  items: CompromisoAgendaDTO[];
};

// GET /v2/desempeno/catalogos (contrato v2 §4b).
export type CatalogosDTO = {
  formas_cobro: Array<{ codigo: string; etiqueta: string }>;
  tipos_visita: Array<{ literal: string; estado: string; grupo: string }>;
};

// Misma forma que ImagenPagoDTO del API; `descripcion` puede omitirse.
export type ImagenDTO = {
  id: string;
  mime: string;
  size_bytes: number;
  descripcion?: string | null;
  created_at: string;
  updated_at: string;
};
