import { describe, it, expect } from "vitest";
import { formatCuotas, formatMoneyShort } from "../format";

describe("formatCuotas", () => {
  it('"43.0000" → "43"', () => expect(formatCuotas("43.0000")).toBe("43"));
  it('"0.8500" → "0.85"', () => expect(formatCuotas("0.8500")).toBe("0.85"));
  it('"0.5000" → "0.5"', () => expect(formatCuotas("0.5000")).toBe("0.5"));
  it("non-finite → returns raw", () => expect(formatCuotas("abc")).toBe("abc"));
});

describe("formatMoneyShort", () => {
  it('"8600.00" → "$8,600"', () => expect(formatMoneyShort("8600.00")).toBe("$8,600"));
});
