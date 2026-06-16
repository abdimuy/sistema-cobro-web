import type { VentaCliente } from "./VentaCliente";
import type { ProductoVenta } from "./ProductoVenta";
import type { Pago } from "./Pago";

// ContratoCredito holds the credit contract details for a credit sale.
// Money fields (parcialidad, enganche, precioDeContado) are decimal strings.
export type ContratoCredito = {
  readonly parcialidad: string;
  readonly enganche: string;
  readonly precioDeContado: string;
  readonly plazoMeses: number;
  readonly formaDePago: string;
  readonly vendedores: string[];
};

// VentaDetalle is the full detail bundle for a single sale: header, line
// items, optional credit contract (null for cash sales), and payment history.
export type VentaDetalle = {
  readonly venta: VentaCliente;
  readonly productos: ProductoVenta[];
  readonly contrato: ContratoCredito | null;
  readonly pagos: Pago[];
};
