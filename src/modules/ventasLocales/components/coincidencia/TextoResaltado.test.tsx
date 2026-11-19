import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextoResaltado } from "./TextoResaltado";

describe("TextoResaltado", () => {
  it("pinta los segmentos coincide:true como <mark> exacta", () => {
    const { container } = render(
      <TextoResaltado
        texto="x"
        segmentos={[
          { texto: "ANA ", coincide: false },
          { texto: "GARCÍA", coincide: true },
        ]}
      />,
    );
    const m = container.querySelector("mark");
    expect(m?.textContent).toBe("GARCÍA");
    expect(m?.classList.contains("coincide")).toBe(true);
    expect(container.querySelectorAll("mark")).toHaveLength(1);
  });

  it("aproximada usa la clase coincide-aprox y no la exacta", () => {
    const { container } = render(
      <TextoResaltado
        texto="x"
        aproximada
        segmentos={[{ texto: "Gracia", coincide: true }]}
      />,
    );
    const m = container.querySelector("mark");
    expect(m?.classList.contains("coincide-aprox")).toBe(true);
    expect(m?.classList.contains("coincide")).toBe(false);
  });

  it("un segmento con <script> se pinta como texto, sin elementos script", () => {
    const { container } = render(
      <TextoResaltado
        texto="x"
        segmentos={[{ texto: "<script>alert(1)</script>", coincide: true }]}
      />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });

  it("sin segmentos pinta el texto plano sin <mark>", () => {
    const { container } = render(<TextoResaltado texto="Ana" />);
    expect(container.textContent).toBe("Ana");
    expect(container.querySelector("mark")).toBeNull();
  });

  it("segmentos vacíos o texto vacío no rompen", () => {
    const a = render(<TextoResaltado texto="Ana" segmentos={[]} />);
    expect(a.container.textContent).toBe("Ana");
    const b = render(<TextoResaltado texto="" />);
    expect(b.container.textContent).toBe("");
  });
});
