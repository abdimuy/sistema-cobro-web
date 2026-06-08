import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditTrailBanner } from "./AuditTrailBanner";
import type { Correction } from "../../infrastructure/mappers/crearVentaBodyToVentaV2WithCorrections";

const corrections: ReadonlyArray<Correction> = [
  {
    path: "cliente.telefono",
    before: "+ABC",
    after: null,
    reason: "el teléfono no cumple el formato E.164 ni 10 dígitos",
  },
  {
    path: "plan_credito.plazo_meses",
    before: 0,
    after: 1,
    reason: "el plazo en meses debe ser un entero mayor o igual a 1",
  },
];

describe("AuditTrailBanner", () => {
  it("renders nothing when corrections is empty", () => {
    const { container } = render(<AuditTrailBanner corrections={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the correction count in the collapsed header", () => {
    render(<AuditTrailBanner corrections={corrections} />);
    const trigger = screen.getByTestId("audit-trail-banner-toggle");
    expect(trigger).toHaveTextContent(/2 auto-correc/i);
  });

  it("does not list the corrections by default (collapsed)", () => {
    render(<AuditTrailBanner corrections={corrections} />);
    expect(screen.queryByText("cliente.telefono")).toBeNull();
  });

  it("expands to show each correction with path, before, after, reason", async () => {
    const user = userEvent.setup();
    render(<AuditTrailBanner corrections={corrections} />);
    await user.click(screen.getByTestId("audit-trail-banner-toggle"));

    const list = screen.getByTestId("audit-trail-banner-list");
    expect(list).toHaveTextContent("cliente.telefono");
    expect(list).toHaveTextContent("plan_credito.plazo_meses");
    expect(list).toHaveTextContent("E.164");
    expect(list).toHaveTextContent("mayor o igual a 1");
  });

  it("renders 'null' for null before/after values", async () => {
    const user = userEvent.setup();
    render(
      <AuditTrailBanner
        corrections={[
          {
            path: "cliente.telefono",
            before: "+ABC",
            after: null,
            reason: "formato inválido",
          },
        ]}
      />,
    );
    await user.click(screen.getByTestId("audit-trail-banner-toggle"));
    const row = screen.getByTestId("audit-trail-row-0");
    expect(row).toHaveTextContent('"+ABC"');
    expect(row).toHaveTextContent("null");
  });

  it("uses singular wording for exactly one correction", () => {
    render(
      <AuditTrailBanner
        corrections={[
          {
            path: "x",
            before: "a",
            after: "b",
            reason: "r",
          },
        ]}
      />,
    );
    const trigger = screen.getByTestId("audit-trail-banner-toggle");
    expect(trigger).toHaveTextContent(/1 auto-correc/i);
    expect(trigger).not.toHaveTextContent(/correcciones/);
  });
});
