import { describe, it, expect } from "vitest";
import { domainToAsignarBody } from "../domainToAsignarBody";

describe("domainToAsignarBody", () => {
  it("incluye los tres slots cuando la identidad completa (3/3) resuelve los tres ids", () => {
    const body = domainToAsignarBody({
      usuarioId: "uid-1",
      listaId1: 101,
      listaId2: 102,
      listaId3: 103,
    });

    expect(body).toEqual({
      vendedor_lista_id_1: 101,
      vendedor_lista_id_2: 102,
      vendedor_lista_id_3: 103,
    });
  });

  it("omite un campo por completo cuando queda undefined (slot sin tocar)", () => {
    const body = domainToAsignarBody({
      usuarioId: "uid-1",
      listaId1: 101,
      listaId2: undefined,
      listaId3: 103,
    });

    expect(body).toEqual({
      vendedor_lista_id_1: 101,
      vendedor_lista_id_3: 103,
    });
    expect("vendedor_lista_id_2" in body).toBe(false);
  });

  it("envía null explícito cuando el llamador limpia un slot deliberadamente (identidad con match_count<3)", () => {
    const body = domainToAsignarBody({
      usuarioId: "uid-1",
      listaId1: 101,
      listaId2: null,
      listaId3: null,
    });

    expect(body).toEqual({
      vendedor_lista_id_1: 101,
      vendedor_lista_id_2: null,
      vendedor_lista_id_3: null,
    });
  });

  it("no manda ningún campo cuando el input no toca ningún slot", () => {
    const body = domainToAsignarBody({ usuarioId: "uid-1" });
    expect(body).toEqual({});
  });
});
