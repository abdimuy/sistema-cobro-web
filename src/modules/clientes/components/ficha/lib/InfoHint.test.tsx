import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfoHint } from "./InfoHint";

describe("InfoHint", () => {
  it("renders without crashing", () => {
    const { container } = render(<InfoHint text="Explicación de prueba." />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders a trigger button with the default aria-label when no label prop is given", () => {
    render(<InfoHint text="Explicación de prueba." />);
    expect(screen.getByRole("button", { name: "Más información" })).toBeInTheDocument();
  });

  it("renders a trigger button with 'Qué significa: <label>' when label prop is given", () => {
    render(<InfoHint text="Explicación de prueba." label="CADENCIA" />);
    expect(
      screen.getByRole("button", { name: "Qué significa: CADENCIA" }),
    ).toBeInTheDocument();
  });

  it("button does not crash when clicked (stopPropagation guard)", () => {
    render(<InfoHint text="Explicación de prueba." label="CADENCIA" />);
    const btn = screen.getByRole("button", { name: "Qué significa: CADENCIA" });
    btn.click();
    // No error thrown — stopPropagation is the purpose of the click handler
    expect(btn).toBeInTheDocument();
  });

  it("applies extra className to the trigger button", () => {
    render(<InfoHint text="texto" label="X" className="extra-class" />);
    const btn = screen.getByRole("button", { name: "Qué significa: X" });
    expect(btn.className).toContain("extra-class");
  });
});
