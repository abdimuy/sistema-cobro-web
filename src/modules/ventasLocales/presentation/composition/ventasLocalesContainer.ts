import { HttpVentaEditAdapter } from "../../infrastructure/http/HttpVentaEditAdapter";
import type { VentaEditPort } from "../../application/ports/VentaEditPort";

const adapter = new HttpVentaEditAdapter();

export const ventasLocalesContainer: { port: VentaEditPort } = {
  port: adapter,
};
