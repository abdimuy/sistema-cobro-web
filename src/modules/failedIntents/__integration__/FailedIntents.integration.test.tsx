import { describe, expect, it } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../../test/msw/server";
import { failedIntentsHandlers } from "../../../test/msw/handlers/failedIntents";
import {
  jsonIntentDTO,
  blobIntentDTO,
} from "../../../test/msw/fixtures/failedIntents";

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

describe("FailedIntents integration", () => {
  it("renders the captured intents and opens the inspector on click", async () => {
    server.use(
      ...failedIntentsHandlers({
        list: {
          items: [jsonIntentDTO, blobIntentDTO],
          hasMore: false,
        },
        get: {
          byId: {
            [jsonIntentDTO.id]: jsonIntentDTO,
            [blobIntentDTO.id]: blobIntentDTO,
          },
        },
      }),
    );

    const user = userEvent.setup();
    setupScreen();

    await waitFor(() =>
      expect(
        screen.getByTestId(`failed-intent-row-${jsonIntentDTO.id}`),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByTestId(`failed-intent-row-${blobIntentDTO.id}`),
    ).toBeInTheDocument();

    // Click the multipart row — the inspector shows the multipart placeholder.
    await user.click(
      screen.getByTestId(`failed-intent-row-${blobIntentDTO.id}`),
    );

    await waitFor(() =>
      expect(screen.getByText(/POST \/v2\/ventas/i)).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("tab", { name: /body/i }));
    expect(screen.getByText(/subida multipart/i)).toBeInTheDocument();

    // Replay-with action card is now ENABLED for multipart rows — it
    // opens the part-by-part multipart editor instead of the JSON one.
    await user.click(screen.getByRole("tab", { name: /acciones/i }));
    expect(
      screen.getByTestId("action-replay-con-correcciones"),
    ).not.toBeDisabled();
  });

  it("Replay tal cual: confirm dialog → 200 → success toast → refresh", async () => {
    let listCalls = 0;
    server.use(
      ...failedIntentsHandlers({
        list: {
          items: [jsonIntentDTO],
          hasMore: false,
          assertParams: () => {
            listCalls++;
          },
        },
        get: { byId: { [jsonIntentDTO.id]: jsonIntentDTO } },
        replay: {
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
    await waitFor(() =>
      expect(
        screen.getByTestId(`failed-intent-row-${jsonIntentDTO.id}`),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByTestId(`failed-intent-row-${jsonIntentDTO.id}`),
    );
    await waitFor(() =>
      expect(screen.getByText(/POST \/v2\/ventas/i)).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("tab", { name: /acciones/i }));
    await user.click(screen.getByTestId("action-replay-tal-cual"));
    await user.click(screen.getByTestId("replay-confirm-button"));

    await waitFor(() =>
      expect(screen.getByText(/replay exitoso/i)).toBeInTheDocument(),
    );
    // Refresh fired: list was re-fetched at least twice (initial + post-replay).
    await waitFor(() => expect(listCalls).toBeGreaterThanOrEqual(2));
  });
});
