import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpBandejaAdapter } from "../HttpBandejaAdapter";
import type {
  ConversacionDetalleResponseDTO,
  ConversacionResumenDTO,
  DecisionResultDTO,
  DictarResponseDTO,
  ListConversacionesResponseDTO,
  OkResponseDTO,
} from "../dtos";

function makeConversacionResumenDTO(
  overrides: Partial<ConversacionResumenDTO> = {},
): ConversacionResumenDTO {
  return {
    cliente_id: 24037,
    nombre: "MINERVA LOPEZ",
    segmento: "recien_liquidado",
    estado: "contactado",
    asignado_a: "",
    updated_at: "2026-07-21T10:00:00Z",
    ultimo_mensaje: "hola, gracias",
    ultima_decision: {
      intencion: "agradece",
      confianza: 92,
      accion: "responder",
      resultado: "propuesto",
      razon_escalamiento: "",
    },
    ...overrides,
  };
}

function makeConversacionDetalleDTO(): ConversacionDetalleResponseDTO {
  return {
    conversacion: {
      cliente_id: 24037,
      nombre: "MINERVA LOPEZ",
      segmento: "recien_liquidado",
      telefono: "2381234567",
      estado: "contactado",
      asignado_a: "",
      contexto_nota: "cliente puntual",
      banderas: ["puntual"],
      resumen_memoria: "conversación inicial",
      created_at: "2026-07-21T09:00:00Z",
      updated_at: "2026-07-21T10:00:00Z",
    },
    turnos: [
      {
        direccion: "entrante",
        autor: "cliente",
        cuerpo: "hola",
        mensaje_ref: "",
        created_at: "2026-07-21T09:30:00Z",
      },
    ],
    decisiones: [
      {
        intencion: "agradece",
        confianza: 92,
        senales: [],
        accion: "responder",
        borrador: "de nada, con gusto",
        evidencia: [],
        razon_escalamiento: "",
        resultado: "propuesto",
        created_at: "2026-07-21T09:31:00Z",
      },
    ],
  };
}

function makeStubClient() {
  const get = vi.fn();
  const post = vi.fn();
  const client = { get, post } as unknown as AxiosInstance;
  return { client, get, post };
}

describe("HttpBandejaAdapter", () => {
  it("listarCola hace GET a /reactivacion/conversaciones sin filtros y mapea los items", async () => {
    const { client, get } = makeStubClient();
    const data: ListConversacionesResponseDTO = { items: [makeConversacionResumenDTO()] };
    get.mockResolvedValue({ data });
    const adapter = new HttpBandejaAdapter(client);

    const result = await adapter.listarCola();

    expect(get).toHaveBeenCalledWith("/reactivacion/conversaciones", {
      params: { estado: undefined, solo_escaladas: undefined },
      signal: undefined,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      clienteId: 24037,
      nombre: "MINERVA LOPEZ",
      segmento: "recien_liquidado",
      estado: "contactado",
      asignadoA: "",
      updatedAt: "2026-07-21T10:00:00Z",
      ultimoMensaje: "hola, gracias",
      ultimaDecision: {
        intencion: "agradece",
        confianza: 92,
        accion: "responder",
        resultado: "propuesto",
        razonEscalamiento: "",
      },
    });
  });

  it("listarCola envía estado y solo_escaladas como query params", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [] } });
    const adapter = new HttpBandejaAdapter(client);

    await adapter.listarCola({ estado: "escalado", soloEscaladas: true });

    expect(get).toHaveBeenCalledWith("/reactivacion/conversaciones", {
      params: { estado: "escalado", solo_escaladas: true },
      signal: undefined,
    });
  });

  it("listarCola propaga el abort signal", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [] } });
    const adapter = new HttpBandejaAdapter(client);
    const ctrl = new AbortController();

    await adapter.listarCola(undefined, ctrl.signal);

    expect(get).toHaveBeenCalledWith("/reactivacion/conversaciones", {
      params: { estado: undefined, solo_escaladas: undefined },
      signal: ctrl.signal,
    });
  });

  it("listarCola mapea ultima_decision null a null", async () => {
    const { client, get } = makeStubClient();
    const data: ListConversacionesResponseDTO = {
      items: [makeConversacionResumenDTO({ ultima_decision: null })],
    };
    get.mockResolvedValue({ data });
    const adapter = new HttpBandejaAdapter(client);

    const result = await adapter.listarCola();

    expect(result[0].ultimaDecision).toBeNull();
  });

  it("obtenerConversacion hace GET a /reactivacion/conversaciones/{clienteId} y mapea el detalle", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: makeConversacionDetalleDTO() });
    const adapter = new HttpBandejaAdapter(client);

    const result = await adapter.obtenerConversacion(24037);

    expect(get).toHaveBeenCalledWith("/reactivacion/conversaciones/24037", { signal: undefined });
    expect(result.conversacion.clienteId).toBe(24037);
    expect(result.conversacion.nombre).toBe("MINERVA LOPEZ");
    expect(result.turnos).toHaveLength(1);
    expect(result.turnos[0]).toEqual({
      direccion: "entrante",
      autor: "cliente",
      cuerpo: "hola",
      mensajeRef: "",
      createdAt: "2026-07-21T09:30:00Z",
    });
    expect(result.decisiones).toHaveLength(1);
    expect(result.decisiones[0].borrador).toBe("de nada, con gusto");
  });

  it("obtenerConversacion propaga el abort signal", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: makeConversacionDetalleDTO() });
    const adapter = new HttpBandejaAdapter(client);
    const ctrl = new AbortController();

    await adapter.obtenerConversacion(24037, ctrl.signal);

    expect(get).toHaveBeenCalledWith("/reactivacion/conversaciones/24037", { signal: ctrl.signal });
  });

  it("aprobar hace POST a /reactivacion/conversaciones/{clienteId}/aprobar sin body", async () => {
    const { client, post } = makeStubClient();
    const data: OkResponseDTO = { ok: true };
    post.mockResolvedValue({ data });
    const adapter = new HttpBandejaAdapter(client);

    await adapter.aprobar(24037);

    expect(post).toHaveBeenCalledWith("/reactivacion/conversaciones/24037/aprobar", undefined);
  });

  it("editar hace POST a /reactivacion/conversaciones/{clienteId}/editar con el body correcto", async () => {
    const { client, post } = makeStubClient();
    post.mockResolvedValue({ data: { ok: true } });
    const adapter = new HttpBandejaAdapter(client);

    await adapter.editar(24037, "texto editado por el operador");

    expect(post).toHaveBeenCalledWith("/reactivacion/conversaciones/24037/editar", {
      texto: "texto editado por el operador",
    });
  });

  it("dictar hace POST a /reactivacion/conversaciones/{clienteId}/dictar y devuelve el borrador", async () => {
    const { client, post } = makeStubClient();
    const data: DictarResponseDTO = { borrador: "hola, tenemos una promoción para ti" };
    post.mockResolvedValue({ data });
    const adapter = new HttpBandejaAdapter(client);

    const result = await adapter.dictar(24037, "ofrecer promoción de fin de mes");

    expect(post).toHaveBeenCalledWith("/reactivacion/conversaciones/24037/dictar", {
      intencion: "ofrecer promoción de fin de mes",
    });
    expect(result).toEqual({ borrador: "hola, tenemos una promoción para ti" });
  });

  it("escalar hace POST a /reactivacion/conversaciones/{clienteId}/escalar con asignado_a", async () => {
    const { client, post } = makeStubClient();
    post.mockResolvedValue({ data: { ok: true } });
    const adapter = new HttpBandejaAdapter(client);

    await adapter.escalar(24037, "uid-brenda");

    expect(post).toHaveBeenCalledWith("/reactivacion/conversaciones/24037/escalar", {
      asignado_a: "uid-brenda",
    });
  });

  it("simularEntrante hace POST a /reactivacion/conversaciones/{clienteId}/mensaje-entrante y mapea el resultado", async () => {
    const { client, post } = makeStubClient();
    const data: DecisionResultDTO = {
      intencion: "quiere comprar",
      confianza: 88,
      senales: ["senal_compra"],
      accion: "responder",
      borrador: "con gusto te apoyo",
      evidencia: ["quiero comprar algo"],
      razon_escalamiento: "",
      resultado: "propuesto",
      escalada: false,
    };
    post.mockResolvedValue({ data });
    const adapter = new HttpBandejaAdapter(client);

    const result = await adapter.simularEntrante(24037, "quiero comprar algo");

    expect(post).toHaveBeenCalledWith("/reactivacion/conversaciones/24037/mensaje-entrante", {
      mensaje: "quiero comprar algo",
    });
    expect(result).toEqual({
      intencion: "quiere comprar",
      confianza: 88,
      senales: ["senal_compra"],
      accion: "responder",
      borrador: "con gusto te apoyo",
      evidencia: ["quiero comprar algo"],
      razonEscalamiento: "",
      resultado: "propuesto",
      escalada: false,
    });
  });

  it("wrappea errores de GET (listarCola) en DomainError con el code del backend", async () => {
    const { client, get } = makeStubClient();
    get.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 403"), {
        isAxiosError: true,
        response: { status: 403, data: { code: "forbidden", message: "forbidden" } },
      }),
    );
    const adapter = new HttpBandejaAdapter(client);

    await expect(adapter.listarCola()).rejects.toMatchObject({
      name: "DomainError",
      code: "forbidden",
    });
  });

  it("wrappea errores de GET (obtenerConversacion) en DomainError", async () => {
    const { client, get } = makeStubClient();
    get.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 404"), {
        isAxiosError: true,
        response: {
          status: 404,
          data: { code: "reactivacion_conversacion_no_encontrada", message: "no existe" },
        },
      }),
    );
    const adapter = new HttpBandejaAdapter(client);

    await expect(adapter.obtenerConversacion(999)).rejects.toMatchObject({
      name: "DomainError",
      code: "reactivacion_conversacion_no_encontrada",
    });
  });

  it("wrappea errores de POST (aprobar) en DomainError", async () => {
    const { client, post } = makeStubClient();
    post.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 422"), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { code: "reactivacion_no_hay_borrador_pendiente", message: "no hay borrador" },
        },
      }),
    );
    const adapter = new HttpBandejaAdapter(client);

    await expect(adapter.aprobar(24037)).rejects.toMatchObject({
      name: "DomainError",
      code: "reactivacion_no_hay_borrador_pendiente",
    });
  });

  it("wrappea errores de POST (simularEntrante) en DomainError", async () => {
    const { client, post } = makeStubClient();
    post.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 422"), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { code: "reactivacion_mensaje_entrante_vacio", message: "vacío" },
        },
      }),
    );
    const adapter = new HttpBandejaAdapter(client);

    await expect(adapter.simularEntrante(24037, "")).rejects.toMatchObject({
      name: "DomainError",
      code: "reactivacion_mensaje_entrante_vacio",
    });
  });
});
