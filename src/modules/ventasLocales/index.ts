// Índice público de Ventas Locales: lo que otros módulos pueden usar sin
// entrar a sus capas internas. Nada más de este módulo debe importarse desde
// fuera (lo vigila src/test/fronterasDeModulos.test.ts).
//
// Ojo, dependencia circular: Clientes importa este índice (fotos del pago) y
// las pestañas del editor importan el índice de Clientes (buscador de
// clientes). Es seguro mientras ninguno de los dos lados use lo del otro al
// evaluar el módulo (sólo al renderizar o al llamar); por eso el adaptador de
// Clientes en useBuscarClientesMicrosip se crea perezosamente.

// Imagen protegida, visor y fuente (Clientes, Desempeño). Se reexporta el
// `default` (lo que esos módulos importaban antes) para que los `vi.mock` de
// las pruebas, que sustituyen sólo el default, sigan aplicando.
export { default as AuthenticatedImage } from "./components/detalle/AuthenticatedImage";
export { default as VentaImagenLightbox } from "./components/detalle/VentaImagenLightbox";
export type { ImagenDeVisor } from "./components/detalle/VentaImagenLightbox";
export type { FuenteImagen } from "./components/detalle/fuenteImagen";

// Diálogo de confirmación (Bandeja, Configuración, Usuarios y roles).
export { ConfirmActionDialog } from "./components/detalle/ConfirmActionDialog";

// Editor de venta reutilizado por la reparación de intentos fallidos.
export { ClienteTab } from "./components/EditarVentaModal/tabs/ClienteTab";
export { PlanTab } from "./components/EditarVentaModal/tabs/PlanTab";
export { ProductosTab } from "./components/EditarVentaModal/tabs/ProductosTab";
export { VendedoresTab } from "./components/EditarVentaModal/tabs/VendedoresTab";
export { ResumenTab } from "./components/EditarVentaModal/tabs/ResumenTab";
export { UnderlineTab } from "./components/EditarVentaModal/shell/UnderlineTabsBar";
export { preciosDeLineas } from "./presentation/preciosDeLineas";
export { useVentaEditState } from "./presentation/hooks/useVentaEditState";
export type { EditarVentaFormData } from "./presentation/hooks/useVentaEditState";

// Value objects del dominio (mappers de intentos fallidos).
export { Monto } from "./domain/values/Monto";
export { Cantidad } from "./domain/values/Cantidad";
export { Telefono } from "./domain/values/Telefono";
