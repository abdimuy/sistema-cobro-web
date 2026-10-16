import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../../test/msw/server";
import { failedIntentsHandlers } from "../../../test/msw/handlers/failedIntents";
import type { FailedIntentDTO } from "../infrastructure/mappers/dtoToFailedIntent";
import { FailedIntentsProvider } from "../presentation/context/FailedIntentsContext";
import { HttpFailedIntentRepoAdapter } from "../infrastructure/http/HttpFailedIntentRepoAdapter";
import { FailedIntentsScreen } from "../components/FailedIntentsScreen";
import { CUERPO_422_ARTICULO, CUERPO_422_SIN_LINEA } from "@/lib/__tests__/cuerposVentas422";

const toastWarning = vi.fn();
vi.mock("sonner", async (importOriginal) => {
  const real = await importOriginal<typeof import("sonner")>();
  return {
    ...real,
    toast: Object.assign(vi.fn(), real.toast, { warning: (...a: unknown[]) => toastWarning(...a) }),
  };
});

const INTENTO: FailedIntentDTO = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-000000000001",
  received_at: "2026-10-16T13:20:00.000Z",
  last_seen_at: "2026-10-16T13:20:00.000Z",
  method: "POST",
  path: "/v2/ventas",
  firebase_uid: "fb-uid-test",
  usuario_id: "22222222-2222-2222-2222-222222222222",
  idempotency_key: "venta-88",
  request_id: "33333333-3333-3333-3333-000000000001",
  body: {
    cliente: { nombre: "Carmen López Zavaleta" },
    tipo_venta: "CREDITO",
    montos: { corto_plazo: "10300.00", anual: "12000.00", contado: "9000.00" },
  },
  body_truncated: false,
  has_blob: false,
  http_status: 422,
  error_code: "precio_anual_credito_requerido",
  error_message: "precio anual",
  retry_count: 0,
  status: "new",
};

async function reenviarCon(cuerpo: unknown) {
  server.use(
    ...failedIntentsHandlers({
      list: { items: [INTENTO], hasMore: false },
      get: { byId: { [INTENTO.id]: INTENTO } },
      replay: {
        response: {
          outcome: "retried_fail",
          replay_http_status: 422,
          replay_body_preview: JSON.stringify(cuerpo),
        },
      },
    }),
  );
  const user = userEvent.setup();
  render(
    <FailedIntentsProvider port={new HttpFailedIntentRepoAdapter(axios.create({ baseURL: "http://api.test/v2" }))}>
      <FailedIntentsScreen />
    </FailedIntentsProvider>,
  );
  await waitFor(() => expect(screen.getByTestId(`intento-card-${INTENTO.id}`)).toBeInTheDocument());
  await user.click(screen.getByTestId(`intento-reenviar-${INTENTO.id}`));
  await user.click(await screen.findByTestId("confirmar-boton"));
  await waitFor(() => expect(toastWarning).toHaveBeenCalled());
  return toastWarning.mock.calls[0] as [string, { description: string }];
}

describe("reenvío de una venta que vuelve a fallar", () => {
  beforeEach(() => toastWarning.mockReset());

  it("con la línea en el cuerpo, el aviso dice qué artículo", async () => {
    const [titulo, opciones] = await reenviarCon(CUERPO_422_ARTICULO);
    expect(titulo).toBe("El reenvío volvió a fallar");
    expect(opciones.description).toBe("El servidor respondió 422 · Artículo: ROPERO 3 PUERTAS");
  });

  it("sin línea, el aviso queda como antes", async () => {
    const [, opciones] = await reenviarCon(CUERPO_422_SIN_LINEA);
    expect(opciones.description).toBe("El servidor respondió 422");
  });
});
