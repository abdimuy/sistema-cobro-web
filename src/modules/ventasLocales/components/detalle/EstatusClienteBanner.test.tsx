import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import EstatusClienteBanner from "./EstatusClienteBanner";

describe("EstatusClienteBanner", () => {
  it("shows the title and blocking body for V", () => {
    render(<EstatusClienteBanner estatus="V" />);
    expect(screen.getByText("Suspensión de ventas")).toBeInTheDocument();
    expect(screen.getByText("No se puede aplicar. Cámbialo en Microsip.")).toBeInTheDocument();
  });

  it("shows the title and blocking body for C", () => {
    render(<EstatusClienteBanner estatus="C" />);
    expect(screen.getByText("Suspensión de créditos")).toBeInTheDocument();
    expect(screen.getByText("No se puede aplicar. Cámbialo en Microsip.")).toBeInTheDocument();
  });

  it("renders nothing for A", () => {
    const { container } = render(<EstatusClienteBanner estatus="A" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for B", () => {
    const { container } = render(<EstatusClienteBanner estatus="B" />);
    expect(container).toBeEmptyDOMElement();
  });
});
