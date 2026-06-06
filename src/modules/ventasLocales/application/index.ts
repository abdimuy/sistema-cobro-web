// Port
export type { VentaEditPort, HeaderInput, ClienteInput, ProductosInput, CombosInput, VendedoresInput, AdjuntarImagenInput, EliminarImagenInput } from "./ports/VentaEditPort";

// DTOs
export type { EdicionVentaInput, HeaderCambios } from "./dto/EdicionVentaInput";
export type { EdicionVentaResult, PasoEdicion } from "./dto/EdicionVentaResult";

// Orchestrator (the only public use case)
export { guardarEdicionVenta } from "./usecases/guardarEdicionVenta";
