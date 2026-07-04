import type { VentasListPort } from "../ports/VentasListPort";
import type { BuscarVentasInput } from "../dto/BuscarVentasInput";
import type { BuscarVentasOutput } from "../dto/BuscarVentasOutput";
import type { VentaLocal } from "../../../../services/api/getVentasLocales";

// FakeVentasListPort is a hand-rolled in-memory implementation of
// VentasListPort that records every call. Use-case and hook tests use it to
// assert the input (and abort signal) forwarded, without standing up a real
// HTTP adapter.
export class FakeVentasListPort implements VentasListPort {
  buscarCalls: Array<{ input: BuscarVentasInput; signal?: AbortSignal }> = [];

  buscarResponse: BuscarVentasOutput | (() => BuscarVentasOutput) = {
    items: [],
    nextCursor: "",
  };

  // When set, the next call throws this error instead of resolving.
  throwOnNext: Error | undefined;

  async buscarVentas(
    input: BuscarVentasInput,
    signal?: AbortSignal,
  ): Promise<BuscarVentasOutput> {
    this.buscarCalls.push({ input, signal });
    if (this.throwOnNext) {
      const e = this.throwOnNext;
      this.throwOnNext = undefined;
      throw e;
    }
    return typeof this.buscarResponse === "function"
      ? this.buscarResponse()
      : this.buscarResponse;
  }
}

export function makeFakeVentaLocal(overrides: Partial<VentaLocal> = {}): VentaLocal {
  const base: VentaLocal = {
    LOCAL_SALE_ID: "3fa1c2b0-3e9e-4b3a-8b1a-000000000001",
    USER_EMAIL: "maria.ramirez@muebleriamsp.mx",
    ALMACEN_ID: 11058,
    NOMBRE_CLIENTE: "GUADALUPE HERNÁNDEZ TORRES",
    FECHA_VENTA: "2026-05-12T00:00:00.000Z",
    LATITUD: 19.4326,
    LONGITUD: -99.1332,
    DIRECCION: "Av. Insurgentes 45",
    PRECIO_TOTAL: 8500,
    TELEFONO: "5512345678",
    TIPO_VENTA: "CREDITO",
    SITUACION: "aprobada",
    SINCRONIZACION: "aplicada",
    ESTADO: "active",
  };
  return { ...base, ...overrides };
}
