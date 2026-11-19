import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArchivoBadge } from "./ArchivoBadge";

describe("ArchivoBadge", () => {
  it("renderiza 'Archivo' con ícono aria-hidden", () => {
    const { container } = render(<ArchivoBadge />);
    expect(screen.getByText("Archivo")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
