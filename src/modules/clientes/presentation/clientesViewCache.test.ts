import { describe, it, expect, beforeEach } from "vitest";
import type { Cliente } from "../domain/entities";
import {
  getView,
  setView,
  patchView,
  clearView,
  setLastClientesUrl,
  getLastClientesUrl,
} from "./clientesViewCache";

// A couple of opaque fixtures — the cache treats items as a black box.
const items = [{ clienteId: 1 }, { clienteId: 2 }] as unknown as Cliente[];

describe("clientesViewCache", () => {
  beforeEach(() => {
    clearView("k");
    clearView("other");
    sessionStorage.clear();
  });

  it("stores and retrieves a full entry", () => {
    setView("k", { items, nextCursor: "c1", facets: {}, scrollTop: 120 });
    const entry = getView("k");
    expect(entry?.items).toBe(items);
    expect(entry?.nextCursor).toBe("c1");
    expect(entry?.scrollTop).toBe(120);
  });

  it("returns undefined for an unknown key", () => {
    expect(getView("other")).toBeUndefined();
  });

  it("patchView updates scrollTop without clobbering data", () => {
    setView("k", { items, nextCursor: "c1", facets: {}, scrollTop: 0 });
    patchView("k", { scrollTop: 540 });
    const entry = getView("k");
    expect(entry?.scrollTop).toBe(540);
    expect(entry?.items).toBe(items); // data preserved
    expect(entry?.nextCursor).toBe("c1");
  });

  it("patchView updates data without clobbering scrollTop", () => {
    setView("k", { items, nextCursor: "c1", facets: {}, scrollTop: 300 });
    const more = [...items, { clienteId: 3 }] as unknown as Cliente[];
    patchView("k", { items: more, nextCursor: "c2" });
    const entry = getView("k");
    expect(entry?.items).toBe(more);
    expect(entry?.nextCursor).toBe("c2");
    expect(entry?.scrollTop).toBe(300); // scroll preserved
  });

  it("patchView seeds an empty entry when none exists", () => {
    patchView("k", { scrollTop: 42 });
    expect(getView("k")).toEqual({
      items: [],
      nextCursor: "",
      facets: {},
      scrollTop: 42,
    });
  });

  it("clearView removes the entry", () => {
    setView("k", { items, nextCursor: "", facets: {}, scrollTop: 0 });
    clearView("k");
    expect(getView("k")).toBeUndefined();
  });

  it("persists and reads the last directory URL", () => {
    expect(getLastClientesUrl()).toBeNull();
    setLastClientesUrl("/clientes?q=aaron&tier=CRITICO");
    expect(getLastClientesUrl()).toBe("/clientes?q=aaron&tier=CRITICO");
  });
});
