import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrearRolDialog } from "../CrearRolDialog";

// Harness that drives `open` externally via a button — mirrors how RolesTab
// opens the dialog with setCrearOpen(true), which bypasses Radix onOpenChange.
function Harness({ onCrear = vi.fn() }: { onCrear?: (input: unknown) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        abrir
      </button>
      <CrearRolDialog open={open} onOpenChange={setOpen} saving={false} onCrear={onCrear} />
    </>
  );
}

describe("CrearRolDialog", () => {
  it("limpia los campos cada vez que se reabre (no arrastra el valor anterior)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "abrir" }));
    const nombre = () => screen.getByLabelText("Nombre") as HTMLInputElement;
    await user.type(nombre(), "Vendedor");
    expect(nombre().value).toBe("Vendedor");

    // Cerrar (Cancelar → onOpenChange(false)) y reabrir por vía externa.
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "abrir" }));

    expect(nombre().value).toBe("");
  });
});
