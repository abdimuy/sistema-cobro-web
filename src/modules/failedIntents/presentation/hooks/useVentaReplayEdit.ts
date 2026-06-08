import { useCallback, useMemo } from "react";
import type { VentaV2 } from "@/services/api/ventaV2Types";
import { useVentaEditState } from "@/modules/ventasLocales/presentation/hooks/useVentaEditState";
import { crearVentaBodyToVentaV2 } from "../../infrastructure/mappers/crearVentaBodyToVentaV2";
import { formDataToCrearVentaBody } from "../../infrastructure/mappers/formDataToCrearVentaBody";

// useVentaReplayEdit wraps useVentaEditState so the ventasLocales tabs
// can drive a CrearVentaBody captured in a FailedIntent. The captured
// body is projected to a synthetic VentaV2 (sentinel defaults for the
// response-only fields + sanitization for values that would trip a
// domain VO), the form is bootstrapped from that, and
// buildSubmitPayload serializes the form back to the wire shape. The
// original body remains the source of truth for the venta id.
//
// available=false ONLY when the body fails the structural guard
// (no productos, no cliente.nombre, etc.). Structurally-valid bodies
// always mount — bad values get surfaced as per-field errors inside
// the form's own validation, not by killing the form.

type UseVentaEditStateReturn = ReturnType<typeof useVentaEditState>;

export type UseVentaReplayEdit =
  | {
      available: true;
      state: UseVentaEditStateReturn;
      buildSubmitPayload: () => unknown | null;
    }
  | {
      available: false;
      state: null;
      buildSubmitPayload: () => null;
    };

// PLACEHOLDER_VENTA is what we hand useVentaEditState when the body
// fails the structural guard (so we still satisfy the rules of hooks
// and call useVentaEditState unconditionally). available=false then
// silences buildSubmitPayload so the placeholder's edits never leak.
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
  const ventaSintetica = useMemo<VentaV2 | null>(
    () => crearVentaBodyToVentaV2(initialBody),
    [initialBody],
  );

  // useVentaEditState is called unconditionally. When the body fails
  // the structural guard, we hand it the placeholder and ignore the
  // resulting state via the available=false branch below.
  const state = useVentaEditState(ventaSintetica ?? PLACEHOLDER_VENTA);

  const buildSubmitPayload = useCallback((): unknown | null => {
    if (ventaSintetica === null) return null;
    if (state.errors.length > 0) return null;
    return formDataToCrearVentaBody(state.formData, initialBody);
  }, [ventaSintetica, state, initialBody]);

  if (ventaSintetica === null) {
    return {
      available: false,
      state: null,
      buildSubmitPayload: () => null,
    };
  }

  return {
    available: true,
    state,
    buildSubmitPayload,
  };
}
