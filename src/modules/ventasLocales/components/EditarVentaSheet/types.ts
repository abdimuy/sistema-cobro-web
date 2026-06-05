// EditarVentaSheet types — re-exported from the presentation hook so tabs have
// a stable import surface even if the hook moves later.

export type {
  ClienteFormData,
  FinancieroFormData,
  ProductoFormData,
  ImagenFormData,
  AlmacenesFormData,
  GPSFormData,
  EditarVentaFormData,
  ValidationError,
  MontoStr,
} from "../../presentation/hooks/useVentaEditState";

export type TabValue = "cliente" | "financiero" | "productos" | "imagenes";
