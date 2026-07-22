import { describe, expect, it } from "vitest";
import { formatElapsed, humanizeSnake, initials, maskTelefono } from "./format";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("MARÍA LÓPEZ HERNÁNDEZ")).toBe("ML");
  });

  it("handles a single word", () => {
    expect(initials("Raquel")).toBe("R");
  });

  it("falls back to ? for an empty name", () => {
    expect(initials("   ")).toBe("?");
  });
});

describe("maskTelefono", () => {
  it("masks the middle digits of a 10-digit MX number with country code", () => {
    expect(maskTelefono("+52 238 000 4521")).toBe("+52 238 ••• 4521");
  });

  it("masks a raw 10-digit number, defaulting country code to 52", () => {
    expect(maskTelefono("2380004521")).toBe("+52 238 ••• 4521");
  });

  it("returns the raw value unchanged when it has fewer than 10 digits", () => {
    expect(maskTelefono("123")).toBe("123");
  });
});

describe("formatElapsed", () => {
  const now = new Date("2026-07-21T10:16:00Z");

  it("< 1 min → ahora", () => {
    expect(formatElapsed("2026-07-21T10:15:45Z", now)).toBe("ahora");
  });

  it("2 minutes → 2 min", () => {
    expect(formatElapsed("2026-07-21T10:14:00Z", now)).toBe("2 min");
  });

  it("59 minutes → 59 min", () => {
    expect(formatElapsed("2026-07-21T09:17:00Z", now)).toBe("59 min");
  });

  it("1 hour → 1 h", () => {
    expect(formatElapsed("2026-07-21T09:16:00Z", now)).toBe("1 h");
  });

  it("3 hours → 3 h", () => {
    expect(formatElapsed("2026-07-21T07:16:00Z", now)).toBe("3 h");
  });

  it("2 days → 2 d", () => {
    expect(formatElapsed("2026-07-19T10:16:00Z", now)).toBe("2 d");
  });

  it("invalid date → empty string", () => {
    expect(formatElapsed("not-a-date", now)).toBe("");
  });
});

describe("humanizeSnake", () => {
  it("replaces underscores and capitalizes the first letter", () => {
    expect(humanizeSnake("ofrecer_comedor")).toBe("Ofrecer comedor");
  });

  it("returns an empty string unchanged", () => {
    expect(humanizeSnake("")).toBe("");
  });
});
