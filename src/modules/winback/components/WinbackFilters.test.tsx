import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WinbackFilters from "./WinbackFilters";

const defaultProps = {
  segmento: undefined as undefined,
  zona: undefined as undefined,
  incluirActivos: false,
  zonaOptions: ["Norte", "Sur", "Centro"],
  onSegmentoChange: vi.fn(),
  onZonaChange: vi.fn(),
  onIncluirActivosChange: vi.fn(),
};

describe("WinbackFilters", () => {
  it("renders the segmento select trigger", () => {
    render(<WinbackFilters {...defaultProps} />);
    // Should show "Todos" as the initial value
    expect(screen.getByText("Todos")).toBeInTheDocument();
  });

  it("renders the zona select trigger", () => {
    render(<WinbackFilters {...defaultProps} />);
    expect(screen.getByText("Todas")).toBeInTheDocument();
  });

  it("renders the incluir activos checkbox", () => {
    render(<WinbackFilters {...defaultProps} />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByLabelText(/incluir activos/i)).toBeInTheDocument();
  });

  it("calls onIncluirActivosChange with true when checkbox is toggled on", async () => {
    const onIncluirActivosChange = vi.fn();
    render(
      <WinbackFilters
        {...defaultProps}
        incluirActivos={false}
        onIncluirActivosChange={onIncluirActivosChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(onIncluirActivosChange).toHaveBeenCalledWith(true);
  });

  it("calls onIncluirActivosChange with false when checked checkbox is toggled off", async () => {
    const onIncluirActivosChange = vi.fn();
    render(
      <WinbackFilters
        {...defaultProps}
        incluirActivos={true}
        onIncluirActivosChange={onIncluirActivosChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(onIncluirActivosChange).toHaveBeenCalledWith(false);
  });

  it("renders zona options in the select when opened", async () => {
    render(<WinbackFilters {...defaultProps} zonaOptions={["Norte", "Sur"]} />);
    // Radix Select triggers are role="combobox" — find the zona one (second combobox)
    const comboboxes = screen.getAllByRole("combobox");
    // First combobox = segmento, second = zona
    const zonaTrigger = comboboxes[1];
    await userEvent.click(zonaTrigger);
    expect(screen.getByText("Norte")).toBeInTheDocument();
    expect(screen.getByText("Sur")).toBeInTheDocument();
  });
});
