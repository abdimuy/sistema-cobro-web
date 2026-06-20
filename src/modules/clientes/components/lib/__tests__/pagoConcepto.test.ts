import { describe, it, expect } from "vitest";
import { categoriaMeta } from "../pagoConcepto";
import { toCategoriaPago } from "../../../domain/values/CategoriaPago";

describe("categoriaMeta", () => {
  it("pago → Pago/Cobranza with green classes", () => {
    const meta = categoriaMeta("pago");
    expect(meta.label).toBe("Pago/Cobranza");
    expect(meta.accentClass).toBeTruthy();
    expect(meta.badgeClass).toBeTruthy();
    expect(meta.dotClass).toBeTruthy();
    expect(meta.badgeClass).toContain("green");
    expect(meta.dotClass).toContain("green");
  });

  it("enganche → Enganche with blue classes", () => {
    const meta = categoriaMeta("enganche");
    expect(meta.label).toBe("Enganche");
    expect(meta.badgeClass).toContain("blue");
    expect(meta.dotClass).toContain("blue");
  });

  it("condonacion → Condonación with violet classes", () => {
    const meta = categoriaMeta("condonacion");
    expect(meta.label).toBe("Condonación");
    expect(meta.badgeClass).toContain("violet");
    expect(meta.dotClass).toContain("violet");
  });

  it("perdida → Mal cliente/fuga with red classes", () => {
    const meta = categoriaMeta("perdida");
    expect(meta.label).toBe("Mal cliente/fuga");
    expect(meta.badgeClass).toContain("red");
    expect(meta.dotClass).toContain("red");
  });

  it("otro → Otro with neutral classes", () => {
    const meta = categoriaMeta("otro");
    expect(meta.label).toBe("Otro");
    expect(meta.badgeClass).toContain("neutral");
    expect(meta.dotClass).toContain("neutral");
  });

  it("all categories return non-empty accentClass", () => {
    const categorias = ["pago", "enganche", "condonacion", "perdida", "otro"] as const;
    for (const cat of categorias) {
      expect(categoriaMeta(cat).accentClass).not.toBe("");
    }
  });

  it("all categories have a non-empty color token", () => {
    const categorias = ["pago", "enganche", "condonacion", "perdida", "otro"] as const;
    for (const cat of categorias) {
      expect(categoriaMeta(cat).color).toBeTruthy();
    }
  });
});

describe("toCategoriaPago", () => {
  it("maps known values", () => {
    expect(toCategoriaPago("pago")).toBe("pago");
    expect(toCategoriaPago("enganche")).toBe("enganche");
    expect(toCategoriaPago("condonacion")).toBe("condonacion");
    expect(toCategoriaPago("perdida")).toBe("perdida");
    expect(toCategoriaPago("otro")).toBe("otro");
  });

  it("maps unknown strings to otro", () => {
    expect(toCategoriaPago("desconocido")).toBe("otro");
    expect(toCategoriaPago("")).toBe("otro");
    expect(toCategoriaPago("PAGO")).toBe("otro");
  });
});
