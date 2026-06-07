import { describe, expect, it } from "vitest";

describe("test infrastructure", () => {
  it("vitest runs in jsdom and document exists", () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });
});
