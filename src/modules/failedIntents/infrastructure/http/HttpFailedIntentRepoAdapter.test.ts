import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import axios from "axios";

import { server } from "../../../../test/msw/server";
import {
  failedIntentsHandlers,
  ADMIN_BASE,
} from "../../../../test/msw/handlers/failedIntents";
import {
  jsonIntentDTO,
  blobIntentDTO,
  resolvedIntentDTO,
} from "../../../../test/msw/fixtures/failedIntents";

import { HttpFailedIntentRepoAdapter } from "./HttpFailedIntentRepoAdapter";
import { DomainError } from "../../domain/errors";

const TEST_BASE_URL = "http://api.test/v2";

function makeAdapter() {
  const client = axios.create({ baseURL: TEST_BASE_URL });
  return new HttpFailedIntentRepoAdapter(client);
}

describe("HttpFailedIntentRepoAdapter", () => {
  describe("list", () => {
    it("forwards status / cursor / page_size as query params and maps the response", async () => {
      let seenURL: URL | undefined;
      server.use(
        ...failedIntentsHandlers({
          list: {
            items: [jsonIntentDTO, blobIntentDTO],
            nextCursor: "opaque-next",
            hasMore: true,
            assertParams: (url) => {
              seenURL = url;
            },
          },
        }),
      );

      const adapter = makeAdapter();
      const out = await adapter.list({
        status: "new",
        cursor: "prev-cursor",
        pageSize: 25,
      });

      expect(seenURL?.searchParams.get("status")).toBe("new");
      expect(seenURL?.searchParams.get("cursor")).toBe("prev-cursor");
      expect(seenURL?.searchParams.get("page_size")).toBe("25");

      expect(out.items).toHaveLength(2);
      expect(out.items[0].id).toBe(jsonIntentDTO.id);
      expect(out.items[1].hasBlob).toBe(true);
      expect(out.nextCursor).toBe("opaque-next");
      expect(out.hasMore).toBe(true);
    });

    it("omits unset query params (status, cursor, page_size all optional)", async () => {
      let seenURL: URL | undefined;
      server.use(
        ...failedIntentsHandlers({
          list: {
            items: [],
            assertParams: (url) => {
              seenURL = url;
            },
          },
        }),
      );
      await makeAdapter().list({});
      expect(seenURL?.searchParams.get("status")).toBeNull();
      expect(seenURL?.searchParams.get("cursor")).toBeNull();
      expect(seenURL?.searchParams.get("page_size")).toBeNull();
    });

    it("normalizes empty next_cursor to null", async () => {
      server.use(
        ...failedIntentsHandlers({
          list: { items: [jsonIntentDTO], nextCursor: "", hasMore: false },
        }),
      );
      const out = await makeAdapter().list({});
      expect(out.nextCursor).toBeNull();
      expect(out.hasMore).toBe(false);
    });
  });

  describe("get", () => {
    it("fetches a single intent by id", async () => {
      server.use(
        ...failedIntentsHandlers({
          get: { byId: { [jsonIntentDTO.id]: jsonIntentDTO } },
        }),
      );
      const intent = await makeAdapter().get(jsonIntentDTO.id);
      expect(intent.id).toBe(jsonIntentDTO.id);
      expect(intent.status.value).toBe("new");
    });

    it("translates a 404 into DomainError(failed_intent_not_found)", async () => {
      server.use(...failedIntentsHandlers({ get: { byId: {} } }));
      try {
        await makeAdapter().get("does-not-exist");
        expect.fail("expected throw");
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).code).toBe("failed_intent_not_found");
      }
    });

    it("url-encodes the id to defend against path traversal", async () => {
      const calls: string[] = [];
      server.use(
        http.get(`${ADMIN_BASE}/:id`, ({ params }) => {
          calls.push(String(params.id));
          return HttpResponse.json(jsonIntentDTO);
        }),
      );
      await makeAdapter().get("../etc/passwd");
      // MSW gives us already-decoded params; axios sent the encoded variant.
      expect(calls[0]).toBe("../etc/passwd");
    });
  });

  describe("replay", () => {
    it("POSTs to /{id}/replay and parses the outcome", async () => {
      let seenId = "";
      server.use(
        ...failedIntentsHandlers({
          replay: {
            assertCall: (id) => {
              seenId = id;
            },
            response: {
              outcome: "retried_ok",
              replay_http_status: 201,
              replay_body_preview: '{"created":true}',
            },
          },
        }),
      );

      const result = await makeAdapter().replay("abc-123");
      expect(seenId).toBe("abc-123");
      expect(result.outcome.value).toBe("retried_ok");
      expect(result.replayHttpStatus).toBe(201);
      expect(result.replayBodyPreview).toBe('{"created":true}');
    });

    it("translates intent_has_no_usuario into a DomainError", async () => {
      server.use(
        ...failedIntentsHandlers({
          replay: {
            error: {
              status: 422,
              body: {
                code: "intent_has_no_usuario",
                message: "no usuario",
              },
            },
          },
        }),
      );
      try {
        await makeAdapter().replay("x");
        expect.fail("expected throw");
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).code).toBe("intent_has_no_usuario");
      }
    });

    it("throws on an unknown outcome string (invariant breach)", async () => {
      server.use(
        ...failedIntentsHandlers({
          replay: {
            response: {
              outcome: "wat",
              replay_http_status: 200,
              replay_body_preview: "",
            },
          },
        }),
      );
      await expect(makeAdapter().replay("x")).rejects.toBeInstanceOf(DomainError);
    });
  });

  describe("replayWith", () => {
    it("POSTs the corrected body wrapped under `body` key", async () => {
      let seenId = "";
      let seenBody: unknown = null;
      server.use(
        ...failedIntentsHandlers({
          replayWith: {
            assertCall: (id, body) => {
              seenId = id;
              seenBody = body;
            },
            response: {
              outcome: "retried_ok",
              replay_http_status: 201,
              replay_body_preview: "{}",
            },
          },
        }),
      );

      await makeAdapter().replayWith("zzz", { cliente: "FIXED" });

      expect(seenId).toBe("zzz");
      expect(seenBody).toEqual({ body: { cliente: "FIXED" } });
    });

    it("maps blob_intent_replay_with_unsupported as a DomainError", async () => {
      server.use(
        ...failedIntentsHandlers({
          replayWith: {
            error: {
              status: 422,
              body: { code: "blob_intent_replay_with_unsupported" },
            },
          },
        }),
      );
      try {
        await makeAdapter().replayWith("zzz", {});
        expect.fail("expected throw");
      } catch (e) {
        expect((e as DomainError).code).toBe(
          "blob_intent_replay_with_unsupported",
        );
      }
    });
  });

  describe("resolve", () => {
    it("PATCHes /{id}/resolve with the status + notes body", async () => {
      let seenBody: unknown = null;
      server.use(
        ...failedIntentsHandlers({
          resolve: {
            assertCall: (_id, body) => {
              seenBody = body;
            },
            response: resolvedIntentDTO,
          },
        }),
      );
      const updated = await makeAdapter().resolve({
        intentId: resolvedIntentDTO.id,
        status: "ignored",
        notes: "duplicado",
      });
      expect(seenBody).toEqual({ status: "ignored", notes: "duplicado" });
      expect(updated.status.value).toBe("ignored");
      expect(updated.notes).toBe("duplicado");
    });

    it("translates a 409 into failed_intent_status_conflict DomainError", async () => {
      server.use(
        ...failedIntentsHandlers({
          resolve: {
            error: {
              status: 409,
              body: { code: "failed_intent_status_conflict" },
            },
          },
        }),
      );
      try {
        await makeAdapter().resolve({
          intentId: "abc",
          status: "ignored",
          notes: "",
        });
        expect.fail("expected throw");
      } catch (e) {
        expect((e as DomainError).code).toBe(
          "failed_intent_status_conflict",
        );
      }
    });
  });
});
