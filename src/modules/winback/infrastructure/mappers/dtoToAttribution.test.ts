import { describe, it, expect } from "vitest";
import { dtoToAttribution } from "./dtoToAttribution";
import type { AttributionDTO } from "../http/dtos";

describe("dtoToAttribution", () => {
  it("happy path: maps all 7 fields correctly with correct types", () => {
    const dto: AttributionDTO = {
      treatment_total: 120,
      treatment_convertidos: 45,
      control_total: 80,
      control_convertidos: 20,
      tasa_treatment: "0.375",
      tasa_control: "0.250",
      uplift: "0.125",
    };

    const result = dtoToAttribution(dto);

    expect(result.treatmentTotal).toBe(120);
    expect(typeof result.treatmentTotal).toBe("number");

    expect(result.treatmentConvertidos).toBe(45);
    expect(typeof result.treatmentConvertidos).toBe("number");

    expect(result.controlTotal).toBe(80);
    expect(typeof result.controlTotal).toBe("number");

    expect(result.controlConvertidos).toBe(20);
    expect(typeof result.controlConvertidos).toBe("number");

    expect(result.tasaTreatment).toBe("0.375");
    expect(typeof result.tasaTreatment).toBe("string");

    expect(result.tasaControl).toBe("0.250");
    expect(typeof result.tasaControl).toBe("string");

    expect(result.uplift).toBe("0.125");
    expect(typeof result.uplift).toBe("string");
  });
});
