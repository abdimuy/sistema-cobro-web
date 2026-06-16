import type { FichaCliente, VentaDetalle } from "../../domain/entities";
import type {
  BuscarClientesInput,
  BuscarClientesOutput,
  ListarVentasInput,
  ListarVentasOutput,
  ObtenerVentaDetalleInput,
  RefrescarBusquedaOutput,
} from "../dto";

// ClientesPort is the outbound interface the clientes module requires from its
// host. The HTTP adapter satisfies it for production, and an in-memory fake
// satisfies it for the use-case tests in this directory.
export interface ClientesPort {
  buscarClientes(
    input: BuscarClientesInput,
    signal?: AbortSignal,
  ): Promise<BuscarClientesOutput>;
  obtenerFicha(
    clienteId: number,
    signal?: AbortSignal,
  ): Promise<FichaCliente>;
  listarVentas(
    input: ListarVentasInput,
    signal?: AbortSignal,
  ): Promise<ListarVentasOutput>;
  obtenerVentaDetalle(
    input: ObtenerVentaDetalleInput,
    signal?: AbortSignal,
  ): Promise<VentaDetalle>;
  refrescarBusqueda(): Promise<RefrescarBusquedaOutput>;
}
