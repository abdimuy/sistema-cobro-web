import { describe, it, expect } from "vitest";
import { cohortMonthToLabel } from "./cohortMonthToLabel";

describe("cohortMonthToLabel", () => {
  it("converts 24318 to Jun 2026", () => {
    // 24318 = 2026*12 + 6 → Jun 2026
    // floor(24317/12) = floor(2026.41...) = 2026
    // (24317 % 12) + 1 = 5 + 1 = 6
    expect(cohortMonthToLabel(24318)).toBe("Jun 2026");
  });

  it("converts 24313 to Ene 2026", () => {
    // 24313 = 2026*12 + 1 → Ene 2026
    // floor(24312/12) = floor(2026) = 2026
    // (24312 % 12) + 1 = 0 + 1 = 1
    expect(cohortMonthToLabel(24313)).toBe("Ene 2026");
  });

  it("converts 24324 to Dic 2026", () => {
    // 24324 = 2026*12 + 12 → Dic 2026
    // floor(24323/12) = floor(2026.91...) = 2026
    // (24323 % 12) + 1 = 11 + 1 = 12
    expect(cohortMonthToLabel(24324)).toBe("Dic 2026");
  });
});
