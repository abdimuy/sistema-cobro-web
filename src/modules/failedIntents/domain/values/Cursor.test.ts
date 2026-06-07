import { describe, expect, it } from "vitest";
import { Cursor } from "./Cursor";
import { DomainError } from "../errors";

describe("Cursor", () => {
  it("wraps any non-empty string opaquely", () => {
    // The frontend never inspects the contents — we just round-trip them
    // back to the backend in `?cursor=`. So the VO accepts whatever
    // base64-ish string the backend hands us.
    const c = Cursor.create("MjAyNi0wNi0wNlQxMjozNDo1Ni43ODlafGE=");
    expect(c).toBeInstanceOf(Cursor);
    expect((c as Cursor).toString()).toBe(
      "MjAyNi0wNi0wNlQxMjozNDo1Ni43ODlafGE=",
    );
  });

  it("rejects the empty string — the caller must use `null` for first page", () => {
    const c = Cursor.create("");
    expect(c).toBeInstanceOf(DomainError);
    expect((c as DomainError).code).toBe("cursor_vacio");
  });
});
