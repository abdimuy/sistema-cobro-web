import { apiClient } from "../../infrastructure/http/apiClient";
import { HttpGarantiasAdapter } from "../../infrastructure/http/HttpGarantiasAdapter";

export function crearGarantiasPort() {
  return new HttpGarantiasAdapter(apiClient);
}
