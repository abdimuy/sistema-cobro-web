import { describe, expect, it } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "../../../test/msw/server";
import { bandejaHandlers, BANDEJA_BASE } from "../../../test/msw/handlers/bandeja";

import { BandejaProvider } from "./context/BandejaContext";
import { HttpBandejaAdapter } from "../infrastructure/http/HttpBandejaAdapter";
import { BandejaScreen } from "./BandejaScreen";
import type {
  ConversacionDetalleResponseDTO,
  ConversacionResumenDTO,
  DecisionResultDTO,
} from "../infrastructure/http/dtos";

const TEST_BASE = "http://api.test/v2";

function setupScreen() {
  const client = axios.create({ baseURL: TEST_BASE });
  const port = new HttpBandejaAdapter(client);
  return render(
    <BandejaProvider port={port}>
      <BandejaScreen />
    </BandejaProvider>,
  );
}

const resumenDTO: ConversacionResumenDTO = {
  cliente_id: 1001,
  nombre: "MARÍA LÓPEZ",
  segmento: "recien_liquidado",
  estado: "conversando",
  asignado_a: "",
  updated_at: "2026-07-21T10:14:00Z",
  ultimo_mensaje: "¿qué tienen de comedores?",
  ultima_decision: {
    intencion: "señal de compra",
    confianza: 88,
    accion: "responder",
    resultado: "pendiente",
    razon_escalamiento: "",
  },
};

const detalleDTO: ConversacionDetalleResponseDTO = {
  conversacion: {
    cliente_id: 1001,
    nombre: "MARÍA LÓPEZ",
    segmento: "recien_liquidado",
    telefono: "+52 238 000 4521",
    estado: "conversando",
    asignado_a: "",
    contexto_nota: "Paga puntual y completo.",
    banderas: [],
    resumen_memoria: "",
    created_at: "2026-07-21T10:00:00Z",
    updated_at: "2026-07-21T10:14:00Z",
  },
  turnos: [
    {
      direccion: "entrante",
      autor: "cliente",
      cuerpo: "¿qué tienen de comedores?",
      mensaje_ref: "",
      created_at: "2026-07-21T10:14:00Z",
    },
  ],
  decisiones: [
    {
      intencion: "señal de compra",
      confianza: 88,
      senales: [],
      accion: "responder",
      borrador: "Tenemos el comedor Roma de 6 sillas. ¿Le mando una foto?",
      evidencia: ["Última compra: sala (liquidada)"],
      razon_escalamiento: "señal de compra directa",
      resultado: "propuesto",
      created_at: "2026-07-21T10:14:00Z",
    },
  ],
};

describe("BandejaScreen integration", () => {
  it("select a conversation → composer shows → Aprobar calls the endpoint and refetches cola + detalle", async () => {
    let listCalls = 0;
    let detalleCalls = 0;
    let aprobarClienteId: number | null = null;

    server.use(
      ...bandejaHandlers({
        list: {
          items: [resumenDTO],
          assertParams: () => {
            listCalls++;
          },
        },
        detalle: {
          byId: { 1001: detalleDTO },
          assertCall: () => {
            detalleCalls++;
          },
        },
        aprobar: {
          assertCall: (clienteId) => {
            aprobarClienteId = clienteId;
          },
        },
      }),
    );

    const user = userEvent.setup();
    setupScreen();

    await waitFor(() => expect(screen.getByText("MARÍA LÓPEZ")).toBeInTheDocument());
    // Both the conversación and ficha columns show the same empty-state copy
    // before anything is selected.
    expect(screen.getAllByText("Selecciona una conversación")).toHaveLength(2);

    await user.click(screen.getByTestId("queue-item-1001"));

    await waitFor(() =>
      expect(screen.getByTestId("borrador-composer")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Tenemos el comedor Roma de 6 sillas/),
    ).toBeInTheDocument();

    const listCallsBefore = listCalls;
    const detalleCallsBefore = detalleCalls;

    await user.click(screen.getByRole("button", { name: /Aprobar y enviar/ }));

    await waitFor(() => expect(aprobarClienteId).toBe(1001));
    await waitFor(() => expect(listCalls).toBeGreaterThan(listCallsBefore));
    await waitFor(() => expect(detalleCalls).toBeGreaterThan(detalleCallsBefore));
  });

  it("simular entrante with a buy signal → the targeted conversation escalates → selecting it shows the briefing (not a composer)", async () => {
    const CLIENTE_ID = 2002;

    let resumen: ConversacionResumenDTO = {
      cliente_id: CLIENTE_ID,
      nombre: "OSCAR MORALES",
      segmento: "por_liquidar_hueco",
      estado: "conversando",
      asignado_a: "",
      updated_at: "2026-07-21T09:00:00Z",
      ultimo_mensaje: "",
      ultima_decision: null,
    };

    let detalle: ConversacionDetalleResponseDTO = {
      conversacion: {
        cliente_id: CLIENTE_ID,
        nombre: "OSCAR MORALES",
        segmento: "por_liquidar_hueco",
        telefono: "+52 238 000 9911",
        estado: "conversando",
        asignado_a: "",
        contexto_nota: "",
        banderas: [],
        resumen_memoria: "",
        created_at: "2026-07-21T09:00:00Z",
        updated_at: "2026-07-21T09:00:00Z",
      },
      turnos: [],
      decisiones: [],
    };

    server.use(
      http.get(BANDEJA_BASE, () => HttpResponse.json({ items: [resumen] })),
      http.get(`${BANDEJA_BASE}/:id`, ({ params }) => {
        if (Number(params.id) !== CLIENTE_ID) {
          return HttpResponse.json(
            { code: "reactivacion_conversacion_no_encontrada", message: "no encontrada" },
            { status: 404 },
          );
        }
        return HttpResponse.json(detalle);
      }),
      http.post(`${BANDEJA_BASE}/:id/mensaje-entrante`, async ({ request }) => {
        const body = (await request.json()) as { mensaje: string };
        const nowIso = "2026-07-21T09:05:00Z";
        const decisionDTO: DecisionResultDTO = {
          intencion: "señal de compra",
          confianza: 90,
          senales: ["senal_compra"],
          accion: "escalar",
          borrador: "",
          evidencia: [],
          razon_escalamiento: "señal de compra directa",
          resultado: "escalado",
          escalada: true,
        };

        resumen = {
          ...resumen,
          estado: "escalado",
          ultimo_mensaje: body.mensaje,
          ultima_decision: {
            intencion: decisionDTO.intencion,
            confianza: decisionDTO.confianza,
            accion: decisionDTO.accion,
            resultado: decisionDTO.resultado,
            razon_escalamiento: decisionDTO.razon_escalamiento,
          },
        };
        detalle = {
          ...detalle,
          conversacion: { ...detalle.conversacion, estado: "escalado" },
          turnos: [
            ...detalle.turnos,
            { direccion: "entrante", autor: "cliente", cuerpo: body.mensaje, mensaje_ref: "", created_at: nowIso },
          ],
          decisiones: [
            ...detalle.decisiones,
            {
              intencion: decisionDTO.intencion,
              confianza: decisionDTO.confianza,
              senales: decisionDTO.senales,
              accion: decisionDTO.accion,
              borrador: decisionDTO.borrador,
              evidencia: decisionDTO.evidencia,
              razon_escalamiento: decisionDTO.razon_escalamiento,
              resultado: decisionDTO.resultado,
              created_at: nowIso,
            },
          ],
        };

        return HttpResponse.json(decisionDTO);
      }),
    );

    const user = userEvent.setup();
    setupScreen();

    await waitFor(() => expect(screen.getByText("OSCAR MORALES")).toBeInTheDocument());
    await user.click(screen.getByTestId(`queue-item-${CLIENTE_ID}`));
    await waitFor(() => expect(screen.getByText(/238 ••• 9911/)).toBeInTheDocument());
    expect(screen.queryByTestId("briefing-escalada")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "🧪 Simular entrante" }));
    await user.type(screen.getByLabelText("Cliente ID a simular"), String(CLIENTE_ID));
    await user.type(
      screen.getByLabelText("Mensaje a simular"),
      "ya me decidí, quiero comprar el comedor",
    );
    await user.click(screen.getByRole("button", { name: "Simular entrante" }));

    await waitFor(() => expect(screen.getByTestId("briefing-escalada")).toBeInTheDocument());
    expect(screen.queryByTestId("borrador-composer")).not.toBeInTheDocument();
    expect(screen.getByText("señal de compra directa")).toBeInTheDocument();
  });
});
