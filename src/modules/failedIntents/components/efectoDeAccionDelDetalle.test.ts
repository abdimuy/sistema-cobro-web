import { describe, expect, it } from "vitest";
import { efectoDeAccionDelDetalle } from "./efectoDeAccionDelDetalle";

describe("efectoDeAccionDelDetalle", () => {
  // La que importa: si alguien devuelve el diálogo al paso de abrir, el
  // editor deja de abrirse y esta prueba se pone roja.
  it("editar y reenviar abre el editor directo, sin diálogo de confirmación", () => {
    expect(efectoDeAccionDelDetalle("replay-with")).toEqual({ tipo: "abrir_editor" });
  });

  it("reenviar sin cambios sí pide confirmación: manda datos de verdad", () => {
    expect(efectoDeAccionDelDetalle("replay")).toEqual({
      tipo: "confirmar",
      accion: "reenviar",
    });
  });

  it("marcar como resuelto sí pide confirmación: cierra el intento", () => {
    expect(efectoDeAccionDelDetalle("resolve")).toEqual({
      tipo: "confirmar",
      accion: "atender",
    });
  });
});
