import { describe, it, expect } from "vitest";
import {
  formatMoney,
  formatPercent,
  formatFecha,
  formatFechaOrDash,
  formatRecencia,
  formatDiasLargo,
} from "./format";

describe("formatMoney", () => {
  it("formats a positive integer string as MXN", () => {
    const result = formatMoney("1500");
    expect(result).toContain("1");
    expect(result).toContain("500");
    // Should be currency formatted (contains $ or MX$ depending on locale)
    expect(result).toMatch(/[$\d]/);
  });

  it("formats zero", () => {
    const result = formatMoney("0");
    // Should not throw, should be a string
    expect(typeof result).toBe("string");
  });

  it("returns the raw string when input is not a number", () => {
    expect(formatMoney("N/A")).toBe("N/A");
    expect(formatMoney("")).toBe("");
    expect(formatMoney("abc")).toBe("abc");
  });

  it("returns the raw string for Infinity", () => {
    expect(formatMoney("Infinity")).toBe("Infinity");
  });

  it("formats decimal string with 0 fraction digits (rounds)", () => {
    const result = formatMoney("1234.99");
    // Should not contain the original decimal form
    expect(result).not.toMatch(/1234\.99/);
    // Should contain 1235 (possibly with grouping separators like commas)
    expect(result.replace(/[,.\s]/g, "")).toMatch(/1235/);
  });
});

describe("formatPercent", () => {
  it("converts decimal proportion to integer percentage", () => {
    expect(formatPercent("0.85")).toBe("85%");
    expect(formatPercent("1.0")).toBe("100%");
    expect(formatPercent("0")).toBe("0%");
    expect(formatPercent("0.333")).toBe("33%");
  });

  it("rounds to nearest integer", () => {
    expect(formatPercent("0.856")).toBe("86%");
    expect(formatPercent("0.854")).toBe("85%");
  });

  it("returns raw string for non-numeric input", () => {
    expect(formatPercent("N/A")).toBe("N/A");
    expect(formatPercent("")).toBe("");
    expect(formatPercent("abc")).toBe("abc");
  });
});

describe("formatFecha", () => {
  it("returns a non-empty string for a valid date", () => {
    const d = new Date(2026, 5, 14); // June 14 2026
    const result = formatFecha(d);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Should contain the year
    expect(result).toContain("2026");
  });

  it("includes month name in Spanish", () => {
    const d = new Date(2026, 0, 15); // January 15
    const result = formatFecha(d);
    // "ene" is the es-MX short for January
    expect(result.toLowerCase()).toContain("ene");
  });
});

describe("formatRecencia", () => {
  it("appends \" d\" suffix", () => {
    expect(formatRecencia(90)).toBe("90 d");
    expect(formatRecencia(0)).toBe("0 d");
    expect(formatRecencia(365)).toBe("365 d");
  });
});

describe("formatDiasLargo", () => {
  it("appends \" días\" suffix", () => {
    expect(formatDiasLargo(90)).toBe("90 días");
    expect(formatDiasLargo(1)).toBe("1 días");
  });
});

describe("formatFechaOrDash", () => {
  it("returns '—' when date is null", () => {
    expect(formatFechaOrDash(null)).toBe("—");
  });

  it("delegates to formatFecha when date is non-null", () => {
    const d = new Date(2026, 5, 14);
    expect(formatFechaOrDash(d)).toBe(formatFecha(d));
  });
});
