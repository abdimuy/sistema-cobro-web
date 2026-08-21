import { describe, expect, it } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../../test/msw/server";
import { failedIntentsHandlers } from "../../../test/msw/handlers/failedIntents";
import { blobIntentDTO } from "../../../test/msw/fixtures/failedIntents";
import type { FailedIntentDTO } from "../infrastructure/mappers/dtoToFailedIntent";

import { FailedIntentsProvider } from "../presentation/context/FailedIntentsContext";
import { HttpFailedIntentRepoAdapter } from "../infrastructure/http/HttpFailedIntentRepoAdapter";
import { FailedIntentsScreen } from "../components/FailedIntentsScreen";

const TEST_BASE = "http://api.test/v2";

function setupScreen() {
  const client = axios.create({ baseURL: TEST_BASE });
  const port = new HttpFailedIntentRepoAdapter(client);
  return render(
    <FailedIntentsProvider port={port}>
      <FailedIntentsScreen />
    </FailedIntentsProvider>,
  );
}

// La misma venta capturada varias veces con la MISMA clave de idempotencia,
// tal como llegan las filas del rezago anterior a la dedup del servidor.
function ventaRepetida(n: number, retryCount = 0): FailedIntentDTO {
  return {
    id: `aaaaaaaa-aaaa-aaaa-aaaa-00000000000${n}`,
    received_at: `2026-08-19T13:${20 + n}:00.000Z`,
    last_seen_at: `2026-08-19T13:${20 + n}:00.000Z`,
    method: "POST",
    path: "/v2/ventas",
    firebase_uid: "fb-uid-test",
    usuario_id: "22222222-2222-2222-2222-222222222222",
    idempotency_key: "venta-77",
    request_id: `33333333-3333-3333-3333-00000000000${n}`,
    body: {
      cliente: { nombre: "Carmen López Zavaleta" },
      tipo_venta: "CREDITO",
      montos: { corto_plazo: "10300.00", anual: "0", contado: "0" },
    },
    body_truncated: false,
    has_blob: false,
    http_status: 422,
    error_code: "articulo_sin_existencia",
    error_message: "sin existencia",
    retry_count: retryCount,
    status: "new",
  };
}

// Un pago que se cura solo: el servidor no respondió.
const PAGO_TRANQUILO: FailedIntentDTO = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  received_at: "2026-08-19T09:00:00.000Z",
  method: "POST",
  path: "/v2/cobranza/pagos",
  idempotency_key: "pago-9",
  request_id: "99999999-9999-9999-9999-999999999999",
  body: null,
  body_truncated: false,
  has_blob: false,
  http_status: 503,
  retry_count: 1,
  status: "new",
};

const FOTOS = {
  content_type: "multipart/form-data; boundary=----WebKitFormBoundary",
  parts: [
    {
      index: 0,
      name: "venta",
      kind: "field",
      content_type: "application/json",
      size_bytes: 12,
      value: btoa("{}"),
    },
    {
      index: 1,
      name: "evidencia",
      kind: "file",
      content_type: "image/jpeg",
      filename: "domicilio.jpg",
      size_bytes: 900_000,
    },
    {
      index: 2,
      name: "evidencia",
      kind: "file",
      content_type: "image/jpeg",
      filename: "ine.jpg",
      size_bytes: 850_000,
    },
  ],
};

describe("FailedIntents integration", () => {
  it("agrupa los reintentos, mezcla ventas y pagos y parte por urgencia", async () => {
    server.use(
      ...failedIntentsHandlers({
        list: {
          items: [ventaRepetida(1), ventaRepetida(2), ventaRepetida(3), PAGO_TRANQUILO],
          hasMore: false,
        },
        get: { byId: { [ventaRepetida(3).id]: ventaRepetida(3) } },
      }),
    );

    setupScreen();

    // Tres filas de la misma venta → UNA tarjeta que dice tres.
    await waitFor(() =>
      expect(screen.getByText("Carmen López Zavaleta")).toBeInTheDocument(),
    );
    expect(screen.getAllByTestId(/^intento-card-/)).toHaveLength(1);
    expect(screen.getByText("3 intentos")).toBeInTheDocument();

    // El pago no pide nada: va a la tabla en calma, no a una tarjeta.
    expect(screen.getByTestId(`intento-tranquilo-${PAGO_TRANQUILO.id}`)).toBeInTheDocument();
    expect(screen.getByText("El servidor no respondió")).toBeInTheDocument();

    // El veredicto de arriba cuenta trabajos, no filas.
    expect(screen.getByTestId("veredicto")).toHaveTextContent(
      "1 necesita que alguien actúe",
    );
    expect(screen.getByTestId("veredicto")).toHaveTextContent(
      "1 se está reintentando sola",
    );

    // Y ningún renglón dice "error desconocido".
    expect(screen.queryByText(/error desconocido/i)).toBeNull();
  });

  it("abre el detalle de una captura multipart y muestra las fotos", async () => {
    const conFotos: FailedIntentDTO = {
      ...blobIntentDTO,
      idempotency_key: "venta-con-fotos",
      error_code: "articulo_sin_existencia",
      error_message: "sin existencia",
      http_status: 422,
    };

    server.use(
      ...failedIntentsHandlers({
        list: { items: [conFotos], hasMore: false },
        get: { byId: { [conFotos.id]: conFotos } },
        blobParts: { byId: { [conFotos.id]: FOTOS } },
        downloadBlobPart: {
          byKey: {
            [`${conFotos.id}:1`]: { bytes: "jpeg-bytes-1", contentType: "image/jpeg" },
            [`${conFotos.id}:2`]: { bytes: "jpeg-bytes-2", contentType: "image/jpeg" },
          },
        },
      }),
    );

    const user = userEvent.setup();
    setupScreen();

    await waitFor(() =>
      expect(screen.getByTestId(`intento-card-${conFotos.id}`)).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId(`intento-abrir-${conFotos.id}`));

    // Las fotos se VEN: una miniatura por parte de imagen, sin descargar el
    // multipart completo. El campo JSON no es una foto y no aparece.
    await waitFor(() => expect(screen.getByTestId("evidencia")).toBeInTheDocument());
    expect(screen.getByTestId("evidencia-parte-1")).toBeInTheDocument();
    expect(screen.getByTestId("evidencia-parte-2")).toBeInTheDocument();
    expect(screen.queryByTestId("evidencia-parte-0")).toBeNull();
    expect(screen.getByText(/2 fotos/)).toBeInTheDocument();
  });

  it("reenviar: modal que nombra la venta → confirmar → aviso y refresco", async () => {
    let listCalls = 0;
    let replayCalls = 0;
    server.use(
      ...failedIntentsHandlers({
        list: {
          items: [ventaRepetida(1, 12)],
          hasMore: false,
          assertParams: () => {
            listCalls++;
          },
        },
        get: { byId: { [ventaRepetida(1).id]: ventaRepetida(1, 12) } },
        replay: {
          assertCall: () => {
            replayCalls++;
          },
          response: {
            outcome: "retried_ok",
            replay_http_status: 201,
            replay_body_preview: '{"created":true}',
          },
        },
      }),
    );

    const user = userEvent.setup();
    setupScreen();

    const id = ventaRepetida(1).id;
    await waitFor(() =>
      expect(screen.getByTestId(`intento-card-${id}`)).toBeInTheDocument(),
    );
    // RETRY_COUNT del servidor: una fila que representa trece intentos.
    expect(screen.getByText("13 intentos")).toBeInTheDocument();

    // Nada se ejecuta al primer clic.
    await user.click(screen.getByTestId(`intento-reenviar-${id}`));
    expect(replayCalls).toBe(0);

    // El modal dice sobre QUÉ.
    const cuerpo = await screen.findByTestId("confirmar-cuerpo");
    expect(cuerpo).toHaveTextContent("Carmen López Zavaleta");
    expect(cuerpo).toHaveTextContent("$10,300.00");

    await user.click(screen.getByTestId("confirmar-boton"));

    await waitFor(() => expect(replayCalls).toBe(1));
    await waitFor(() => expect(screen.getByText("Reenviado")).toBeInTheDocument());
    await waitFor(() => expect(listCalls).toBeGreaterThanOrEqual(2));
  });

  it("cancelar el modal no llama al servidor", async () => {
    let replayCalls = 0;
    server.use(
      ...failedIntentsHandlers({
        list: { items: [ventaRepetida(1)], hasMore: false },
        get: { byId: { [ventaRepetida(1).id]: ventaRepetida(1) } },
        replay: {
          assertCall: () => {
            replayCalls++;
          },
        },
      }),
    );

    const user = userEvent.setup();
    setupScreen();

    const id = ventaRepetida(1).id;
    await waitFor(() =>
      expect(screen.getByTestId(`intento-card-${id}`)).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId(`intento-ignorar-${id}`));
    await screen.findByTestId("confirmar-ignorar");
    await user.click(screen.getByText("Cancelar"));

    await waitFor(() => expect(screen.queryByTestId("confirmar-ignorar")).toBeNull());
    expect(replayCalls).toBe(0);
  });
});
