import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientesFilters } from "./ClientesFilters";

function noop() {
  // intentionally empty
}

// Helper: open the Filtros popover, then open the nth combobox (0-based).
// In the popover: [0] = Segmento, [1] = Estado pago, [2] = Riesgo, [3] = Score mínimo.
async function openFilterSelect(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: /filtros/i }));
  const combos = screen.getAllByRole("combobox");
  await user.click(combos[index]);
}

describe("ClientesFilters facet counts", () => {
  it("shows formatted count next to each segmento option when facets present", async () => {
    const user = userEvent.setup();
    render(
      <ClientesFilters
        onChange={noop}
        facets={{
          segmento: { ACTIVO: 9000, DORMIDO_VALIOSO: 1240 },
          estado_pago: { AL_CORRIENTE: 8000 },
        }}
      />,
    );

    await openFilterSelect(user, 0); // Segmento select

    // The select content (portaled into body) should show the facet counts
    expect(await screen.findByText("(9,000)")).toBeInTheDocument();
    expect(screen.getByText("(1,240)")).toBeInTheDocument();
  });

  it("shows formatted count next to each estado_pago option when facets present", async () => {
    const user = userEvent.setup();
    render(
      <ClientesFilters
        onChange={noop}
        facets={{
          estado_pago: { AL_CORRIENTE: 8000, MOROSO: 1240 },
        }}
      />,
    );

    await openFilterSelect(user, 1); // Estado pago select

    expect(await screen.findByText("(8,000)")).toBeInTheDocument();
    expect(screen.getByText("(1,240)")).toBeInTheDocument();
  });

  it("shows no count when facets are absent for a given option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ClientesFilters
        onChange={onChange}
        facets={{ segmento: { ACTIVO: 500 } }}
      />,
    );

    await openFilterSelect(user, 0); // Segmento select

    // ACTIVO has a count; DORMIDO_VALIOSO etc. do not
    expect(await screen.findByText("(500)")).toBeInTheDocument();
    // No "(0)" label for options with no facet entry
    expect(screen.queryByText("(0)")).not.toBeInTheDocument();
  });

  it("shows no count when facets prop is omitted", async () => {
    const user = userEvent.setup();
    render(<ClientesFilters onChange={noop} />);

    await openFilterSelect(user, 0); // Segmento select

    // None of the options should have a count parenthetical
    expect(screen.queryByText(/\(\d/)).not.toBeInTheDocument();
  });

  it("shows tier_riesgo facet counts in Riesgo select", async () => {
    const user = userEvent.setup();
    render(
      <ClientesFilters
        onChange={noop}
        facets={{
          tier_riesgo: { AL_DIA: 320, CRITICO: 45 },
        }}
      />,
    );

    await openFilterSelect(user, 2); // Riesgo select (index 2)

    expect(await screen.findByText("(320)")).toBeInTheDocument();
    expect(screen.getByText("(45)")).toBeInTheDocument();
  });

  it("tier filter with no facet entry shows label without count", async () => {
    const user = userEvent.setup();
    render(
      <ClientesFilters
        onChange={noop}
        facets={{
          tier_riesgo: { AL_DIA: 320 },
        }}
      />,
    );

    await openFilterSelect(user, 2); // Riesgo select

    // VIGILANCIA has no facet count — should appear without parenthetical
    expect(await screen.findByText("Vigilancia")).toBeInTheDocument();
    // Only AL_DIA has a count
    expect(screen.getByText("(320)")).toBeInTheDocument();
    expect(screen.queryByText("(0)")).not.toBeInTheDocument();
  });

  it("tierRiesgo filter changes are reported", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ClientesFilters
        onChange={onChange}
        facets={{ tier_riesgo: { EN_RIESGO: 12 } }}
      />,
    );

    await openFilterSelect(user, 2); // Riesgo select

    const option = await screen.findByText("En riesgo");
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith({ tierRiesgo: "EN_RIESGO" });
  });
});
