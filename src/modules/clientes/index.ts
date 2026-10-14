// Índice público de Clientes: lo que otros módulos (Desempeño, Cartera,
// Ventas Locales) pueden usar sin entrar a sus capas internas. Los
// componentes necesitan el contexto del módulo: envolver con
// ClientesContainer (producción) o ClientesProvider (pruebas).
//
// Dominio, caso de uso y adaptador van primero: Ventas Locales (buscador de
// clientes del editor de venta) los usa, y su índice a su vez lo importa
// PagoFotos de aquí; ver la nota de dependencia circular en
// src/modules/ventasLocales/index.ts.
export type { Cliente } from "./domain/entities";
export { DomainError } from "./domain/errors";
export { buscarClientes } from "./application/usecases/buscarClientes";
export { HttpClientesAdapter } from "./infrastructure/http/HttpClientesAdapter";

export { ClienteFicha } from "./components/ficha/ClienteFicha";
export { VentaModal } from "./components/detalle/VentaModal";
export { PagoModal } from "./components/detalle/PagoModal";
export { Panel } from "./components/ficha/lib/Panel";
export { ClientesContainer } from "./presentation/composition/ClientesContainer";
export { ClientesProvider } from "./presentation/context/ClientesContext";
