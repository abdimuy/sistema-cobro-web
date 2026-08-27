import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MontoInput } from "./MontoInput";

/**
 * Dos anfitriones, porque MontoInput se usa de dos formas distintas en el modal
 * de edición y ambas tienen que seguir funcionando:
 *
 *  - HostNumerico  reproduce literalmente CombosTableInline / ProductosTableInline:
 *      value={String(n)}  onChange={(v) => setN(parseFloat(v) || 0)}
 *    Es el sitio del defecto: `parseFloat("1250.")` es 1250 y el punto se borraba
 *    solo, así que "1250.50" terminaba guardado como 125050.
 *
 *  - HostString    reproduce PlanTab y AgregarComboPanel, donde el estado del
 *    padre ya es un string y el componente sólo lo transporta.
 */

function HostNumerico({
  inicial = 0,
  onChangeSpy,
}: {
  inicial?: number;
  onChangeSpy?: (next: string) => void;
}) {
  const [n, setN] = useState<number>(inicial);
  return (
    <>
      <MontoInput
        value={String(n)}
        onChange={(v) => {
          onChangeSpy?.(v);
          setN(parseFloat(v) || 0);
        }}
      />
      <output data-testid="estado">{String(n)}</output>
      <button type="button">salir</button>
    </>
  );
}

function HostString({
  inicial = "",
  onChangeSpy,
}: {
  inicial?: string;
  onChangeSpy?: (next: string) => void;
}) {
  const [s, setS] = useState<string>(inicial);
  return (
    <>
      <MontoInput
        value={s}
        onChange={(v) => {
          onChangeSpy?.(v);
          setS(v);
        }}
      />
      <output data-testid="estado">{s}</output>
      <button type="button">salir</button>
    </>
  );
}

const campo = () => screen.getByRole("textbox");
const estado = () => screen.getByTestId("estado").textContent;
const salir = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "salir" }));

describe("MontoInput — captura de decimales (el defecto)", () => {
  it("teclear 1250.50 deja 1250.5 en el estado, no 125050", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={0} />);

    await user.clear(campo());
    await user.type(campo(), "1250.50");

    expect(campo()).toHaveValue("1250.50");
    expect(estado()).toBe("1250.5");
  });

  it("partir de 1000 y añadir .75 da 1000.75", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={1000} />);

    await user.type(campo(), ".75");

    expect(campo()).toHaveValue("1000.75");
    expect(estado()).toBe("1000.75");
  });

  it("el punto sobrevive a la pulsación siguiente", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={0} />);

    await user.clear(campo());
    await user.type(campo(), "1250");
    await user.type(campo(), ".");

    // Aquí es donde se perdía: parseFloat("1250.") = 1250 y el repintado
    // devolvía "1250" al input.
    expect(campo()).toHaveValue("1250.");
  });

  it("se puede dejar el campo vacío mientras se edita, sin saltar a 0", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={1000} />);

    await user.clear(campo());

    expect(campo()).toHaveValue("");
  });
});

describe("MontoInput — qué queda al salir del campo", () => {
  it("vacío: el padre numérico queda en 0 y el campo lo refleja", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={1000} />);

    await user.clear(campo());
    await salir(user);

    expect(estado()).toBe("0");
    expect(campo()).toHaveValue("0");
  });

  it("vacío: el padre string queda vacío y el campo queda vacío", async () => {
    const user = userEvent.setup();
    render(<HostString inicial="1000" />);

    await user.clear(campo());
    await salir(user);

    expect(estado()).toBe("");
    expect(campo()).toHaveValue("");
  });

  it('sólo un punto (".") se descarta', async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={0} />);

    await user.clear(campo());
    await user.type(campo(), ".");
    await salir(user);

    expect(estado()).toBe("0");
    expect(campo()).toHaveValue("0");
  });

  it('el punto colgante de "12." se recorta a 12', async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={0} />);

    await user.clear(campo());
    await user.type(campo(), "12.");
    await salir(user);

    expect(estado()).toBe("12");
    expect(campo()).toHaveValue("12");
  });

  it('"12." también se recorta en el padre string', async () => {
    const user = userEvent.setup();
    render(<HostString inicial="" />);

    await user.type(campo(), "12.");
    await salir(user);

    expect(estado()).toBe("12");
    expect(campo()).toHaveValue("12");
  });

  it("el padre string conserva el cero final que el usuario tecleó", async () => {
    const user = userEvent.setup();
    render(<HostString inicial="" />);

    await user.type(campo(), "1250.50");
    await salir(user);

    expect(estado()).toBe("1250.50");
    expect(campo()).toHaveValue("1250.50");
  });

  it("el padre numérico normaliza el cero final al canónico del número", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={0} />);

    await user.clear(campo());
    await user.type(campo(), "1250.50");
    await salir(user);

    expect(estado()).toBe("1250.5");
    expect(campo()).toHaveValue("1250.5");
  });

  it("las letras no sobreviven al salir del campo", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={0} />);

    await user.clear(campo());
    await user.type(campo(), "abc");
    await salir(user);

    expect(estado()).toBe("0");
    expect(campo()).toHaveValue("0");
  });
});

describe("MontoInput — lo que el componente NUNCA impidió", () => {
  // Caracterización deliberada: el componente jamás filtró el signo ni las
  // letras durante el tecleo — es un input de texto sin validación, y lo era
  // también antes del arreglo. La red que atrapa un negativo es `Monto.create`
  // al guardar ("el monto no puede ser negativo"), no este campo. Estas pruebas
  // fijan ese contrato para que ponerle filtro sea una decisión consciente y no
  // un accidente; es un cambio de producto aparte del arreglo del decimal.
  it("acepta un valor negativo (el filtro nunca estuvo aquí)", async () => {
    const user = userEvent.setup();
    render(<HostNumerico inicial={0} />);

    await user.clear(campo());
    await user.type(campo(), "-5");
    await salir(user);

    expect(estado()).toBe("-5");
    expect(campo()).toHaveValue("-5");
  });

  it("deja teclear letras (no se filtra la pulsación, se limpia al salir)", async () => {
    const user = userEvent.setup();
    render(<HostString inicial="" />);

    await user.type(campo(), "ab");

    expect(campo()).toHaveValue("ab");
  });
});

describe("MontoInput — el contrato de onChange en vivo", () => {
  it("emite en cada pulsación, incluida la intermedia con el punto colgante", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<HostString inicial="" onChangeSpy={spy} />);

    await user.type(campo(), "12.5");

    expect(spy.mock.calls.map((c) => c[0])).toEqual(["1", "12", "12.", "12.5"]);
  });
});

describe("MontoInput — la prop value que cambia desde fuera", () => {
  it("un value nuevo sin foco en el campo se ve", () => {
    const spy = vi.fn();
    const { rerender } = render(<MontoInput value="10" onChange={spy} />);

    expect(campo()).toHaveValue("10");

    rerender(<MontoInput value="999" onChange={spy} />);

    expect(campo()).toHaveValue("999");
  });

  it("un value nuevo NO pisa lo que el usuario está tecleando", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const { rerender } = render(<MontoInput value="10" onChange={spy} />);

    await user.click(campo());
    await user.type(campo(), "5");
    expect(campo()).toHaveValue("105");

    // El padre repinta con otro valor mientras el campo tiene el foco.
    rerender(<MontoInput value="999" onChange={spy} />);

    expect(campo()).toHaveValue("105");
  });

  it("tras salir del campo, el value de fuera vuelve a mandar", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const { rerender } = render(
      <>
        <MontoInput value="10" onChange={spy} />
        <button type="button">salir</button>
      </>,
    );

    await user.click(campo());
    await user.type(campo(), "5");
    rerender(
      <>
        <MontoInput value="999" onChange={spy} />
        <button type="button">salir</button>
      </>,
    );
    await salir(user);

    expect(campo()).toHaveValue("999");
  });

  it("el reset del formulario (value a vacío) se ve estando sin foco", () => {
    const spy = vi.fn();
    const { rerender } = render(<MontoInput value="1250.5" onChange={spy} />);

    rerender(<MontoInput value="" onChange={spy} />);

    expect(campo()).toHaveValue("");
  });
});

describe("MontoInput — presentación", () => {
  it("mantiene el prefijo, el placeholder por defecto y aria-invalid", () => {
    render(<MontoInput value="" onChange={vi.fn()} error />);

    expect(screen.getByText("$")).toBeInTheDocument();
    expect(campo()).toHaveAttribute("placeholder", "0.00");
    expect(campo()).toHaveAttribute("aria-invalid", "true");
    expect(campo()).toHaveAttribute("inputmode", "decimal");
  });
});
