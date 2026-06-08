import { useCallback, useMemo } from "react";
import type { VentaV2 } from "@/services/api/ventaV2Types";
import { useVentaEditState } from "@/modules/ventasLocales/presentation/hooks/useVentaEditState";
import { crearVentaBodyToVentaV2 } from "../../infrastructure/mappers/crearVentaBodyToVentaV2";
import { crearVentaBodyToVentaV2WithCorrections } from "../../infrastructure/mappers/crearVentaBodyToVentaV2WithCorrections";
import type { Correction } from "../../infrastructure/mappers/crearVentaBodyToVentaV2WithCorrections";
import { formDataToCrearVentaBody } from "../../infrastructure/mappers/formDataToCrearVentaBody";

// useVentaReplayEdit wraps useVentaEditState so the ventasLocales tabs
// can drive a CrearVentaBody captured in a FailedIntent. Returns the
// editor state plus the audit-trail `corrections` recorded by the
// bootstrap mapper — every silent sanitization is on the record so
// the UI can surface them to the operator.

type UseVentaEditStateReturn = ReturnType<typeof useVentaEditState>;

export type UseVentaReplayEdit =
  | {
      available: true;
      state: UseVentaEditStateReturn;
      buildSubmitPayload: () => unknown | null;
      corrections: ReadonlyArray<Correction>;
    }
  | {
      available: false;
      state: null;
      buildSubmitPayload: () => null;
      corrections: ReadonlyArray<Correction>;
    };

const PLACEHOLDER_VENTA = crearVentaBodyToVentaV2({
  id: "00000000-0000-0000-0000-000000000000",
  cliente: { nombre: "placeholder" },
  direccion: { calle: "x", colonia: "x", poblacion: "x", ciudad: "x" },
  gps: { latitud: 0, longitud: 0 },
  fecha_venta: "1970-01-01T00:00:00Z",
  tipo_venta: "CONTADO",
  montos: { anual: "0.00", corto_plazo: "0.00", contado: "0.00" },
  combos: [],
  productos: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      articulo_id: 0,
      articulo: "x",
      cantidad: "1",
      precio_anual: "0.00",
      precio_corto: "0.00",
      precio_contado: "0.00",
      combo_id: null,
      almacen_origen_id: 1,
      almacen_destino_id: 2,
    },
  ],
  vendedores: [
    {
      id: "00000000-0000-0000-0000-000000000002",
      usuario_id: "00000000-0000-0000-0000-000000000003",
      email: "placeholder@local",
      nombre: "x",
    },
  ],
}) as VentaV2;

export function useVentaReplayEdit(initialBody: unknown): UseVentaReplayEdit {
  const bootstrap = useMemo(
    () => crearVentaBodyToVentaV2WithCorrections(initialBody),
    [initialBody],
  );

  const state = useVentaEditState(bootstrap.venta ?? PLACEHOLDER_VENTA);

  const buildSubmitPayload = useCallback((): unknown | null => {
    if (bootstrap.venta === null) return null;
    if (state.errors.length > 0) return null;
    return formDataToCrearVentaBody(state.formData, initialBody);
  }, [bootstrap, state, initialBody]);

  if (bootstrap.venta === null) {
    return {
      available: false,
      state: null,
      buildSubmitPayload: () => null,
      corrections: bootstrap.corrections,
    };
  }

  return {
    available: true,
    state,
    buildSubmitPayload,
    corrections: bootstrap.corrections,
  };
}
