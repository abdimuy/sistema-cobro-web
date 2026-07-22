import { describe, expect, it } from "vitest";
import { dayLabel, formatHM } from "./time";

describe("formatHM", () => {
  it("renders HH:mm padded", () => {
    expect(formatHM("2026-07-21T05:02:00")).toBe("05:02");
  });

  it("returns empty string for an invalid date", () => {
    expect(formatHM("not-a-date")).toBe("");
  });
});

describe("dayLabel", () => {
  const now = new Date("2026-07-21T12:00:00");

  it("today → Hoy", () => {
    expect(dayLabel("2026-07-21T08:00:00", now)).toBe("Hoy");
  });

  it("yesterday → Ayer", () => {
    expect(dayLabel("2026-07-20T08:00:00", now)).toBe("Ayer");
  });

  it("older → day + short month", () => {
    expect(dayLabel("2026-07-10T08:00:00", now)).toBe("10 jul");
  });
});
