import { useCallback, useMemo } from "react";
import type { VentaV2 } from "@/services/api/ventaV2Types";
import { useVentaEditState } from "@/modules/ventasLocales/presentation/hooks/useVentaEditState";
import { ventaV2ToDomain } from "@/modules/ventasLocales/infrastructure/mappers/ventaV2ToDomain";
import { crearVentaBodyToVentaV2 } from "../../infrastructure/mappers/crearVentaBodyToVentaV2";
import { formDataToCrearVentaBody } from "../../infrastructure/mappers/formDataToCrearVentaBody";

// useVentaReplayEdit wraps useVentaEditState so the ventasLocales tabs
// can drive a CrearVentaBody captured in a FailedIntent. The captured
// body is projected to a synthetic VentaV2 (sentinel defaults for the
// response-only fields), the form is bootstrapped from that, and
// buildSubmitPayload serializes the form back to the wire shape — the
// original body remains the source of truth for the venta id.
//
// available=false means the body is not venta-shaped, OR a value
// inside it is rejected by a domain VO (monto "abc", GPS out of
// range). In both cases the caller should fall back to raw-JSON
// editing; the form cannot host a broken body.

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

// useVentaEditState calls ventaV2ToDomain internally, which throws on
// bad data. We need to call the hook unconditionally (rules of hooks),
// so bootstrap validates the projection eagerly and we hand the hook
// EITHER the real venta or a known-good placeholder. The
// available=false branch silences buildSubmitPayload regardless of
// what the placeholder state looks like.
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
  const bootstrap = useMemo<{ ok: true; venta: VentaV2 } | { ok: false }>(() => {
    const projected = crearVentaBodyToVentaV2(initialBody);
    if (projected === null) return { ok: false };
    try {
      // Trial-run the projection through the domain mapper so we know
      // useVentaEditState (which calls the same mapper) won't throw.
      ventaV2ToDomain(projected);
      return { ok: true, venta: projected };
    } catch {
      return { ok: false };
    }
  }, [initialBody]);

  const ventaForHook = bootstrap.ok ? bootstrap.venta : PLACEHOLDER_VENTA;
  const state = useVentaEditState(ventaForHook);

  const buildSubmitPayload = useCallback((): unknown | null => {
    if (!bootstrap.ok) return null;
    if (state.errors.length > 0) return null;
    return formDataToCrearVentaBody(state.formData, initialBody);
  }, [bootstrap, state, initialBody]);

  if (!bootstrap.ok) {
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
