import { describe, expect, it } from "vitest";
import { HttpMethod } from "./HttpMethod";
import { DomainError } from "../errors";

describe("HttpMethod", () => {
  it("accepts the five supported verbs", () => {
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      const v = HttpMethod.create(m);
      expect(v).toBeInstanceOf(HttpMethod);
      expect((v as HttpMethod).value).toBe(m);
    }
  });

  it("normalizes lowercase to uppercase", () => {
    const v = HttpMethod.create("post");
    expect((v as HttpMethod).value).toBe("POST");
  });

  it("rejects unknown methods (e.g. CONNECT, TRACE)", () => {
    expect(HttpMethod.create("CONNECT")).toBeInstanceOf(DomainError);
    expect(HttpMethod.create("FETCH")).toBeInstanceOf(DomainError);
  });
});
