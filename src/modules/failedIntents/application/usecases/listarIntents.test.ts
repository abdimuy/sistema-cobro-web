import { describe, expect, it } from "vitest";
import { listarIntents } from "./listarIntents";
import { FakeRepoPort, makeFakeIntent } from "../__tests__/fakeRepoPort";
import { DomainError } from "../../domain/errors";

describe("listarIntents", () => {
  it("forwards status, cursor, pageSize to the port verbatim", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [makeFakeIntent()],
      nextCursor: "opaque-cursor",
      hasMore: true,
    };

    const out = await listarIntents(port, {
      status: "new",
      cursor: "prev-cursor",
      pageSize: 25,
    });

    expect(port.listCalls).toHaveLength(1);
    expect(port.listCalls[0].input).toEqual({
      status: "new",
      cursor: "prev-cursor",
      pageSize: 25,
    });
    expect(out.items).toHaveLength(1);
    expect(out.nextCursor).toBe("opaque-cursor");
    expect(out.hasMore).toBe(true);
  });

  it("rejects non-positive page sizes", async () => {
    const port = new FakeRepoPort();
    await expect(listarIntents(port, { pageSize: 0 })).rejects.toBeInstanceOf(
      DomainError,
    );
    await expect(listarIntents(port, { pageSize: -1 })).rejects.toBeInstanceOf(
      DomainError,
    );
  });

  it("rejects pageSize > 100 (mirrors the backend clamp)", async () => {
    const port = new FakeRepoPort();
    const err = listarIntents(port, { pageSize: 999 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "page_size_excedido" });
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeRepoPort();
    const ctrl = new AbortController();
    await listarIntents(port, { status: "new" }, ctrl.signal);
    expect(port.listCalls[0].signal).toBe(ctrl.signal);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeRepoPort();
    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext.list = e;
    await expect(listarIntents(port, {})).rejects.toBe(e);
  });
});
