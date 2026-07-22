import { describe, expect, it } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../../test/msw/server";
import { bandejaHandlers } from "../../../test/msw/handlers/bandeja";

import { BandejaProvider } from "./context/BandejaContext";
import { HttpBandejaAdapter } from "../infrastructure/http/HttpBandejaAdapter";
import { BandejaScreen } from "./BandejaScreen";
import type {
  ConversacionDetalleResponseDTO,
  ConversacionResumenDTO,
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
});
