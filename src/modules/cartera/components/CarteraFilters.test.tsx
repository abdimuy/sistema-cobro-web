import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarteraFilters from "./CarteraFilters";
import type { FilterOption } from "./CarteraFilters";

const defaultProps = {
  zona: undefined as string | undefined,
  cobrador: undefined as string | undefined,
  periodo: undefined as string | undefined,
  zonaOptions: [] as FilterOption[],
  cobradorOptions: [] as FilterOption[],
  onZonaChange: vi.fn(),
  onCobradorChange: vi.fn(),
  onPeriodoChange: vi.fn(),
};

describe("CarteraFilters", () => {
  it("renders Todas and Todos as all-option labels", () => {
    render(<CarteraFilters {...defaultProps} />);
    expect(screen.getByText("Todas")).toBeInTheDocument();
    expect(screen.getByText("Todos")).toBeInTheDocument();
  });

  it("renders zona options with NAME labels when dropdown is opened", async () => {
    const zonaOptions: FilterOption[] = [
      { value: "10", label: "ZONA NORTE" },
      { value: "20", label: "ZONA SUR" },
    ];
    render(<CarteraFilters {...defaultProps} zonaOptions={zonaOptions} />);

    const comboboxes = screen.getAllByRole("combobox");
    // First combobox = zona
    await userEvent.click(comboboxes[0]);
    expect(screen.getByText("ZONA NORTE")).toBeInTheDocument();
    expect(screen.getByText("ZONA SUR")).toBeInTheDocument();
  });

  it("emits the ID value (not the label) when a zona is selected", async () => {
    const onZonaChange = vi.fn();
    const zonaOptions: FilterOption[] = [
      { value: "42", label: "ZONA ORIENTE" },
    ];
    render(
      <CarteraFilters
        {...defaultProps}
        zonaOptions={zonaOptions}
        onZonaChange={onZonaChange}
      />,
    );

    const comboboxes = screen.getAllByRole("combobox");
    await userEvent.click(comboboxes[0]);
    await userEvent.click(screen.getByText("ZONA ORIENTE"));
    expect(onZonaChange).toHaveBeenCalledWith("42");
  });

  it("renders cobrador options with NAME labels when dropdown is opened", async () => {
    const cobradorOptions: FilterOption[] = [
      { value: "3", label: "GARCIA LOPEZ" },
      { value: "7", label: "MARTINEZ RUIZ" },
    ];
    render(<CarteraFilters {...defaultProps} cobradorOptions={cobradorOptions} />);

    const comboboxes = screen.getAllByRole("combobox");
    // Second combobox = cobrador
    await userEvent.click(comboboxes[1]);
    expect(screen.getByText("GARCIA LOPEZ")).toBeInTheDocument();
    expect(screen.getByText("MARTINEZ RUIZ")).toBeInTheDocument();
  });

  it("emits the cobrador ID value when a cobrador is selected", async () => {
    const onCobradorChange = vi.fn();
    const cobradorOptions: FilterOption[] = [
      { value: "5", label: "PEREZ SANCHEZ" },
    ];
    render(
      <CarteraFilters
        {...defaultProps}
        cobradorOptions={cobradorOptions}
        onCobradorChange={onCobradorChange}
      />,
    );

    const comboboxes = screen.getAllByRole("combobox");
    await userEvent.click(comboboxes[1]);
    await userEvent.click(screen.getByText("PEREZ SANCHEZ"));
    expect(onCobradorChange).toHaveBeenCalledWith("5");
  });

  it("emits undefined when Todas is selected for zona", async () => {
    const onZonaChange = vi.fn();
    const zonaOptions: FilterOption[] = [{ value: "10", label: "ZONA NORTE" }];
    render(
      <CarteraFilters
        {...defaultProps}
        zona="10"
        zonaOptions={zonaOptions}
        onZonaChange={onZonaChange}
      />,
    );

    const comboboxes = screen.getAllByRole("combobox");
    await userEvent.click(comboboxes[0]);
    await userEvent.click(screen.getByRole("option", { name: "Todas" }));
    expect(onZonaChange).toHaveBeenCalledWith(undefined);
  });
});
