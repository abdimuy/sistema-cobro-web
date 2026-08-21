import { describe, expect, it } from "vitest";
import { Causa } from "../Causa";
import { DomainError } from "../../errors";

describe("Causa.create", () => {
  it("acepta las cinco causas del catálogo", () => {
    for (const v of Causa.values()) {
      expect((Causa.create(v) as Causa).value).toBe(v);
    }
  });

  it("rechaza cualquier otra", () => {
    expect(Causa.create("timeout")).toBeInstanceOf(DomainError);
    expect(Causa.create("")).toBeInstanceOf(DomainError);
  });
});

describe("Causa.desde — el código manda sobre el status", () => {
  // La ambigüedad real de producción: el MISMO 422 significa dos cosas
  // distintas, y la pantalla vieja las pintaba idénticas.
  it("422 con articulo_sin_existencia es falta de inventario", () => {
    expect(Causa.desde("articulo_sin_existencia", 422).value).toBe("falta_inventario");
  });

  it("422 con cualquier otro código es cuerpo ilegible", () => {
    expect(Causa.desde("cliente_nombre_required", 422).value).toBe("cuerpo_ilegible");
    expect(Causa.desde("cantidad_no_positiva", 422).value).toBe("cuerpo_ilegible");
  });

  it("422 SIN código cae en desconocida", () => {
    // Es el caso medido en producción: el capturador no encuentra `code` en
    // el problem+json y la columna queda vacía.
    expect(Causa.desde(null, 422).value).toBe("desconocida");
    expect(Causa.desde("", 422).value).toBe("desconocida");
    expect(Causa.desde("   ", 422).value).toBe("desconocida");
  });

  it("falta de inventario gana aunque el status no sea 422", () => {
    expect(Causa.desde("articulo_sin_existencia", 409).value).toBe("falta_inventario");
    expect(Causa.desde("articulo_sin_existencia", 500).value).toBe("falta_inventario");
  });
});

describe("Causa.desde — infraestructura", () => {
  it("5xx es servidor que no respondió", () => {
    expect(Causa.desde(null, 500).value).toBe("servidor_no_respondio");
    expect(Causa.desde("lo_que_sea", 502).value).toBe("servidor_no_respondio");
    expect(Causa.desde(null, 503).value).toBe("servidor_no_respondio");
  });

  it("status 0 —nadie contestó— también", () => {
    expect(Causa.desde(null, 0).value).toBe("servidor_no_respondio");
  });

  it("los códigos de Firebird son infraestructura, no cuerpo", () => {
    // Llegan como 409/422 pero se curan solos: el pool envenenado, un lock.
    expect(Causa.desde("firebird_lock_conflict", 409).value).toBe("servidor_no_respondio");
    expect(Causa.desde("firebird_error", 422).value).toBe("servidor_no_respondio");
  });
});

describe("Causa.desde — subida cortada", () => {
  it("408 y 413 son transmisión, no contenido", () => {
    expect(Causa.desde(null, 408).value).toBe("subida_cortada");
    expect(Causa.desde(null, 413).value).toBe("subida_cortada");
  });

  it("los códigos de cuerpo incompleto también", () => {
    expect(Causa.desde("body_read_failed", 400).value).toBe("subida_cortada");
    expect(Causa.desde("multipart_invalido", 422).value).toBe("subida_cortada");
  });
});

describe("Causa.desde — lo que NO se fuerza a una etiqueta", () => {
  it("403 con código no es cuerpo ilegible: es desconocida", () => {
    // Un permiso denegado trae código y es 4xx, pero llamarlo "el servidor
    // rechazó los datos" sería mentir. Cae en desconocida y la pantalla
    // muestra el mensaje del servidor, que sí dice la verdad.
    expect(Causa.desde("permiso_denegado", 403).value).toBe("desconocida");
  });

  it("404 con código tampoco", () => {
    expect(Causa.desde("cliente_no_encontrado", 404).value).toBe("desconocida");
  });
});

describe("Causa.titulo — nunca 'error desconocido'", () => {
  it("cada causa clasificada tiene su frase", () => {
    expect(Causa.desde("articulo_sin_existencia", 422).titulo()).toBe(
      "Sin existencia en almacén",
    );
    expect(Causa.desde(null, 500).titulo()).toBe("El servidor no respondió");
    expect(Causa.desde(null, 408).titulo()).toBe("La subida se cortó");
    expect(Causa.desde("cliente_nombre_required", 422).titulo()).toBe(
      "El servidor rechazó los datos",
    );
  });

  it("sin clasificar, el título es el mensaje del servidor", () => {
    const c = Causa.desde(null, 422);
    expect(c.titulo("el nombre del cliente es obligatorio")).toBe(
      "el nombre del cliente es obligatorio",
    );
  });

  it("sin clasificar y sin mensaje, dice qué falta — no 'error desconocido'", () => {
    const c = Causa.desde(null, 422);
    expect(c.titulo(null)).toBe("Sin detalle del servidor");
    expect(c.titulo("   ")).toBe("Sin detalle del servidor");
  });

  it("ninguna causa produce jamás el título vacío ni 'error desconocido'", () => {
    for (const v of Causa.values()) {
      const causa = Causa.create(v) as Causa;
      for (const mensaje of [null, "", "   ", "algo pasó"]) {
        const t = causa.titulo(mensaje);
        expect(t.trim()).not.toBe("");
        expect(t.toLowerCase()).not.toContain("error desconocido");
      }
    }
  });
});

describe("Causa.necesitaPersona", () => {
  it("inventario y cuerpo rechazado sí; el resto no", () => {
    expect((Causa.create("falta_inventario") as Causa).necesitaPersona()).toBe(true);
    expect((Causa.create("cuerpo_ilegible") as Causa).necesitaPersona()).toBe(true);
    expect((Causa.create("servidor_no_respondio") as Causa).necesitaPersona()).toBe(false);
    expect((Causa.create("subida_cortada") as Causa).necesitaPersona()).toBe(false);
    expect((Causa.create("desconocida") as Causa).necesitaPersona()).toBe(false);
  });
});
