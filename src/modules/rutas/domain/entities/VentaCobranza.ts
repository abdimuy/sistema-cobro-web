export interface VentaCobranza {
  ventaId: number;
  clienteId: number;
  clienteNombre: string;
  folio: string;
  doctoPvId: number;
  parcialidad: string;
  frecuencia: string;
  abonoSemana: string;
  vencidas: string;
  aporte: string;
  saldo: string;
  aplicaPonderado: boolean;
  atrasoAntesCuotas: string;
  atrasoAntesPesos: string;
  pagoCuotas: string;
  atrasoDespuesCuotas: string;
  atrasoDespuesPesos: string;
}
