// DTOs de /v2/desempeno/* — nombres JSON EXACTOS del contrato v2
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
  forma_cobro_id: number;
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
  cobertura_por_segmento: { sin_visitar: number; volver: number; despues: number; pagados: number; sin_nada: number };
  cobro: { cobrado: string; esperado: string; falta: string; pct: string | null };
  lineas: LineaDelDiaDTO[];
};

export type TableroDTO = {
  generado_at: string;
  periodo: string;
  pausa_min: number;
  usuarios: UsuarioTableroDTO[];
};

export type JornadaDTO = {
  uid: string;
  fecha: string;
  pausa_min: number;
  generado_at: string;
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
    condonaciones: number;
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
  segmento: string | null;
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
  conteos: { sin_visitar: number; volver: number; despues: number; pagados: number; sin_nada: number; total: number };
  cuentas: CuentaDTO[];
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
