// Índice público de Clientes: lo que otros módulos (Desempeño) pueden usar sin
// entrar a sus capas internas. Los componentes necesitan el contexto del
// módulo: envolver con ClientesContainer (producción) o ClientesProvider (pruebas).
export { ClienteFicha } from "./components/ficha/ClienteFicha";
export { VentaModal } from "./components/detalle/VentaModal";
export { PagoModal } from "./components/detalle/PagoModal";
export { ClientesContainer } from "./presentation/composition/ClientesContainer";
export { ClientesProvider } from "./presentation/context/ClientesContext";
