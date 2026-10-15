import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ControlUmbralPausa, DEMORA_UMBRAL_MS } from "../ControlUmbralPausa";

// Envuelve el control con estado real para que el valor aplicado regrese
// como prop, igual que con usePreferencias.
function montar(inicial = 45) {
  const onCambiar = vi.fn();
  function Con() {
    const [valor, setValor] = useState(inicial);
    return (
      <ControlUmbralPausa
        valor={valor}
        onCambiar={(m) => {
          onCambiar(m);
          setValor(m);
        }}
      />
    );
  }
  render(<Con />);
  const user = userEvent.setup({ delay: null });
  const campo = screen.getByRole("spinbutton", { name: "Minutos de pausa" });
  return { onCambiar, user, campo };
}

const esperar = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("ControlUmbralPausa", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("es un grupo con nombre y botones rápidos 15/30/45/60/90 con el activo marcado", () => {
    montar(45);
    expect(screen.getByRole("group", { name: "Pausa desde" })).toBeInTheDocument();
    for (const m of [15, 30, 60, 90]) {
      expect(screen.getByRole("button", { name: `${m} min` })).toHaveAttribute("aria-pressed", "false");
    }
    expect(screen.getByRole("button", { name: "45 min" })).toHaveAttribute("aria-pressed", "true");
  });

  it("un botón rápido aplica su valor al instante y queda resaltado", async () => {
    const { onCambiar, user, campo } = montar(45);
    await user.click(screen.getByRole("button", { name: "90 min" }));
    expect(onCambiar).toHaveBeenCalledWith(90);
    expect(screen.getByRole("button", { name: "90 min" })).toHaveAttribute("aria-pressed", "true");
    expect(campo).toHaveValue(90);
  });

  it("un valor fuera de los botones no resalta ninguno", () => {
    montar(37);
    for (const m of [15, 30, 45, 60, 90]) {
      expect(screen.getByRole("button", { name: `${m} min` })).toHaveAttribute("aria-pressed", "false");
    }
    expect(screen.getByRole("spinbutton", { name: "Minutos de pausa" })).toHaveValue(37);
  });

  it("tecleo libre: no consulta por tecla, aplica una sola vez tras la pausa corta", async () => {
    const { onCambiar, user, campo } = montar(45);
    await user.clear(campo);
    await user.type(campo, "37");
    expect(onCambiar).not.toHaveBeenCalled();
    await esperar(DEMORA_UMBRAL_MS);
    expect(onCambiar).toHaveBeenCalledTimes(1);
    expect(onCambiar).toHaveBeenCalledWith(37);
  });

  it("Enter aplica en el acto sin esperar", async () => {
    const { onCambiar, user, campo } = montar(45);
    await user.clear(campo);
    await user.type(campo, "120{Enter}");
    expect(onCambiar).toHaveBeenCalledTimes(1);
    expect(onCambiar).toHaveBeenCalledWith(120);
    await esperar(DEMORA_UMBRAL_MS * 2);
    expect(onCambiar).toHaveBeenCalledTimes(1);
  });

  it("al salir del campo (blur) aplica en el acto", async () => {
    const { onCambiar, user, campo } = montar(45);
    await user.clear(campo);
    await user.type(campo, "8");
    fireEvent.blur(campo);
    expect(onCambiar).toHaveBeenCalledWith(8);
  });

  it.each([
    ["4", "menor al mínimo"],
    ["241", "mayor al máximo"],
    ["12.5", "con decimales"],
  ])("rechaza %s (%s) con mensaje y sin mandarlo", async (texto) => {
    const { onCambiar, user, campo } = montar(45);
    await user.clear(campo);
    await user.type(campo, `${texto}{Enter}`);
    await esperar(DEMORA_UMBRAL_MS * 2);
    expect(onCambiar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("entre 5 y 240 minutos");
    expect(campo).toHaveAttribute("aria-invalid", "true");
  });

  it("acepta los límites 5 y 240", async () => {
    const { onCambiar, user, campo } = montar(45);
    await user.clear(campo);
    await user.type(campo, "5{Enter}");
    expect(onCambiar).toHaveBeenLastCalledWith(5);
    await user.clear(campo);
    await user.type(campo, "240{Enter}");
    expect(onCambiar).toHaveBeenLastCalledWith(240);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("si se sale con un valor inválido regresa al vigente y quita el aviso", async () => {
    const { onCambiar, user, campo } = montar(45);
    await user.clear(campo);
    await user.type(campo, "300");
    fireEvent.blur(campo);
    expect(onCambiar).not.toHaveBeenCalled();
    expect(campo).toHaveValue(45);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("flechas subir/bajar van de 5 en 5 al múltiplo siguiente y respetan los límites", async () => {
    const { onCambiar, user, campo } = montar(37);
    await user.click(screen.getByRole("button", { name: "Subir 5 minutos" }));
    expect(campo).toHaveValue(40);
    await user.click(screen.getByRole("button", { name: "Subir 5 minutos" }));
    expect(campo).toHaveValue(45);
    // Clics seguidos: una sola consulta al final.
    expect(onCambiar).not.toHaveBeenCalled();
    await esperar(DEMORA_UMBRAL_MS);
    expect(onCambiar).toHaveBeenCalledTimes(1);
    expect(onCambiar).toHaveBeenCalledWith(45);

    await user.click(campo);
    await user.keyboard("{ArrowDown}");
    expect(campo).toHaveValue(40);
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(campo).toHaveValue(50);
  });

  it("las flechas no salen de 5–240", async () => {
    const { user, campo } = montar(5);
    expect(screen.getByRole("button", { name: "Bajar 5 minutos" })).toBeDisabled();
    await user.click(campo);
    await user.keyboard("{ArrowDown}");
    expect(campo).toHaveValue(5);
    await user.clear(campo);
    await user.type(campo, "238{Enter}");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(campo).toHaveValue(240);
    expect(screen.getByRole("button", { name: "Subir 5 minutos" })).toBeDisabled();
  });

  it("si el valor cambia desde afuera (otra pantalla) el campo lo refleja", () => {
    const { rerender } = render(<ControlUmbralPausa valor={45} onCambiar={vi.fn()} />);
    rerender(<ControlUmbralPausa valor={75} onCambiar={vi.fn()} />);
    expect(screen.getByRole("spinbutton", { name: "Minutos de pausa" })).toHaveValue(75);
  });
});
