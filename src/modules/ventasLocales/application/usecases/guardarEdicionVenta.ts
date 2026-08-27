import type { VentaEditPort } from "../ports/VentaEditPort";
import type { EdicionVentaInput } from "../dto/EdicionVentaInput";
import type { EdicionVentaResult, PasoEdicion } from "../dto/EdicionVentaResult";
import type { Venta } from "../../domain/entities/Venta";
import { DomainError } from "../../domain/errors";
import { actualizarClienteVenta } from "./actualizarClienteVenta";
import { actualizarHeaderVenta } from "./actualizarHeaderVenta";
import { reemplazarLineasVenta } from "./reemplazarLineasVenta";
import { reemplazarVendedoresVenta } from "./reemplazarVendedoresVenta";
import { adjuntarImagenVenta } from "./adjuntarImagenVenta";
import { eliminarImagenVenta } from "./eliminarImagenVenta";

type StepError = { __error: DomainError };

function isStepError(v: unknown): v is StepError {
  return typeof v === "object" && v !== null && "__error" in v;
}

async function runStep<T>(fn: () => Promise<T>): Promise<T | StepError> {
  try {
    return await fn();
  } catch (err) {
    const error =
      err instanceof DomainError
        ? err
        : new DomainError(
            "error_inesperado",
            err instanceof Error ? err.message : String(err),
          );
    return { __error: error };
  }
}

export async function guardarEdicionVenta(
  deps: { port: VentaEditPort },
  input: EdicionVentaInput,
): Promise<EdicionVentaResult> {
  let venta: Venta = input.ventaActual;
  const pasosExitosos: PasoEdicion[] = [];

  // 1. Cliente
  if (input.cambios.cliente !== undefined) {
    const out = await runStep(() =>
      actualizarClienteVenta(deps, {
        ventaID: venta.id,
        cliente: input.cambios.cliente!,
      }),
    );
    if (isStepError(out)) {
      return { ventaActualizada: venta, pasosExitosos, errorParcial: { paso: "cliente", error: out.__error } };
    }
    venta = out;
    pasosExitosos.push("cliente");
  }

  // 2. Header
  if (input.cambios.header !== undefined) {
    const h = input.cambios.header;
    const out = await runStep(() =>
      actualizarHeaderVenta(deps, { ventaID: venta.id, ...h }),
    );
    if (isStepError(out)) {
      return { ventaActualizada: venta, pasosExitosos, errorParcial: { paso: "header", error: out.__error } };
    }
    venta = out;
    pasosExitosos.push("header");
  }

  // 3. Líneas — combos y productos en UNA sola petición.
  //
  // Antes eran dos pasos, "combos primero porque los productos referencian
  // comboID". Ese orden no puede funcionar cuando se borra un combo y se crea
  // otro: el combo nuevo no cubre a los productos viejos, y al revés los
  // productos nuevos apuntan a un combo inexistente. El API valida ahora las
  // referencias contra el estado final de las dos colecciones.
  if (input.cambios.lineas !== undefined) {
    const lineas = input.cambios.lineas;
    const out = await runStep(() =>
      reemplazarLineasVenta(deps, {
        ventaID: venta.id,
        combos: lineas.combos,
        productos: lineas.productos,
      }),
    );
    if (isStepError(out)) {
      return { ventaActualizada: venta, pasosExitosos, errorParcial: { paso: "lineas", error: out.__error } };
    }
    venta = out;
    pasosExitosos.push("lineas");
  }

  // 4. Vendedores
  if (input.cambios.vendedores !== undefined) {
    const out = await runStep(() =>
      reemplazarVendedoresVenta(deps, {
        ventaID: venta.id,
        vendedores: input.cambios.vendedores!,
      }),
    );
    if (isStepError(out)) {
      return { ventaActualizada: venta, pasosExitosos, errorParcial: { paso: "vendedores", error: out.__error } };
    }
    venta = out;
    pasosExitosos.push("vendedores");
  }

  // 5. Eliminar imágenes (server IDs)
  for (const imgID of input.cambios.imagenesAEliminar) {
    const out = await runStep(() =>
      eliminarImagenVenta(deps, { ventaID: venta.id, imagenID: imgID }),
    );
    if (isStepError(out)) {
      return { ventaActualizada: venta, pasosExitosos, errorParcial: { paso: "eliminar_imagen", error: out.__error } };
    }
    pasosExitosos.push("eliminar_imagen");
    // Optimistically remove from venta.imagenes
    venta = venta.withImagenes(venta.imagenes.filter((i) => i.id !== imgID));
  }

  // 6. Adjuntar nuevas imágenes
  for (const nueva of input.cambios.imagenesNuevas) {
    const out = await runStep(() =>
      adjuntarImagenVenta(deps, { ventaID: venta.id, imagen: nueva }),
    );
    if (isStepError(out)) {
      return { ventaActualizada: venta, pasosExitosos, errorParcial: { paso: "adjuntar_imagen", error: out.__error } };
    }
    pasosExitosos.push("adjuntar_imagen");
    // Append the newly-created server image
    venta = venta.withImagenes([...venta.imagenes, out]);
  }

  return { ventaActualizada: venta, pasosExitosos, errorParcial: null };
}
