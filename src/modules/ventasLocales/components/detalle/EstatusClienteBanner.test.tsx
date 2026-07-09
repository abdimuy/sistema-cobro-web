import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import EstatusClienteBanner from "./EstatusClienteBanner";

describe("EstatusClienteBanner", () => {
  it("shows the vetado title and body for V", () => {
    render(<EstatusClienteBanner estatus="V" />);
    expect(screen.getByText("Cliente vetado")).toBeInTheDocument();
    expect(screen.getByText(/marcado como vetado en microsip/i)).toBeInTheDocument();
  });

  it("shows the cancelado title and body for C", () => {
    render(<EstatusClienteBanner estatus="C" />);
    expect(screen.getByText("Cliente cancelado")).toBeInTheDocument();
    expect(screen.getByText(/marcado como cancelado en microsip/i)).toBeInTheDocument();
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
