export type { Conteo } from "./Conteo";
export {
  TIPOS_ACTIVIDAD,
  FORMAS_COBRO,
  refImagenesDeActividad,
} from "./Actividad";
export type {
  TipoActividad,
  FormaCobro,
  OrigenRegistro,
  RegistradoPor,
  PagoDeActividad,
  VisitaDeActividad,
  Actividad,
  RefImagenes,
} from "./Actividad";
export type {
  PuntoLinea,
  Pausa,
  Tramo,
  HoraDelDia,
  LineaDelDia,
  ResumenPausas,
} from "./Linea";
export { TIPOS_SENAL, esTipoSenal } from "./Senal";
export type { TipoSenal, Senal } from "./Senal";
export {
  PERIODOS,
  esPeriodo,
  ESTADOS_AHORA,
  esEstadoAhora,
  MOTIVOS_NO_CONFIGURADO,
  esMotivoNoConfigurado,
} from "./Tablero";
export type {
  Periodo,
  EstadoAhora,
  MotivoNoConfigurado,
  UltimaActividadUsuario,
  PagosPorForma,
  CoberturaPorSegmento,
  CobroSemana,
  UsuarioTablero,
  Tablero,
} from "./Tablero";
export type { ResumenJornada, Jornada } from "./Jornada";
export {
  ORDENES_ACTIVIDAD,
  REGISTRADO_POR_OFICINA,
  LIMITE_PAGINA_ACTIVIDAD,
  FILTROS_ACTIVIDAD_INICIALES,
} from "./ActividadZona";
export type {
  OrdenActividad,
  Direccion,
  FiltrosActividad,
  TotalesActividad,
  PaginaActividad,
} from "./ActividadZona";
export { ORDENES_CUENTAS } from "./Cuentas";
export type {
  UltimaActividadCuenta,
  Cuenta,
  ConteosCuentas,
  CuentasSemana,
  SegmentoFiltro,
  OrdenCuentas,
} from "./Cuentas";
export type { ImagenAdjunta } from "./Imagen";
export type { Catalogos, FormaCobroCatalogo, TipoVisitaCatalogo } from "./Catalogos";
