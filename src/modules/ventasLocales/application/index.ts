// Port
export type { VentaEditPort, HeaderInput, ClienteInput, LineasInput, VendedoresInput, AdjuntarImagenInput, EliminarImagenInput } from "./ports/VentaEditPort";

// DTOs
export type { EdicionVentaInput, HeaderCambios, LineasCambios } from "./dto/EdicionVentaInput";
export type { EdicionVentaResult, PasoEdicion } from "./dto/EdicionVentaResult";

// Orchestrator (the only public use case)
export { guardarEdicionVenta } from "./usecases/guardarEdicionVenta";
