import { DomainError } from "../errors";

// Causa es POR QUÉ falló el intento, en las palabras de quien tiene que
// hacer algo al respecto — no en las del servidor.
//
// Vive en el dominio y no en el componente porque la clasificación ES la
// regla de negocio de esta pantalla: de ella sale la urgencia, y de la
// urgencia sale si el renglón le grita a una persona o se queda en la tabla
// tranquila. Un `switch` dentro de un JSX no se puede probar sin montar la
// pantalla entera, y esta clasificación tiene casos que hay que fijar uno por
// uno.
//
// El catálogo es CERRADO. Cinco valores, y el último —`desconocida`— no es un
// cajón de sastre cosmético: es la señal de que el servidor no dejó código, y
// dispara que el título use SU mensaje en vez de una etiqueta inventada.
//
// Regla dura: **nunca "error desconocido" como título.** Es lo que hoy hace
// ilegible la pantalla —una fila por intento repitiendo la misma frase vacía—
// y es exactamente la información que no ayuda a nadie.
const CAUSAS = [
  "falta_inventario",
  "servidor_no_respondio",
  "subida_cortada",
  "cuerpo_ilegible",
  "desconocida",
] as const;

export type CausaValue = (typeof CAUSAS)[number];

// Códigos que el API devuelve cuando el artículo no tiene existencia. El
// canónico lo declara internal/inventario/domain/errors.go; se compara por
// código y no por status porque llega como 422, igual que media docena de
// validaciones que NO son falta de inventario.
const CODIGOS_SIN_EXISTENCIA = new Set(["articulo_sin_existencia"]);

// Infraestructura que se cura sola: el pool de Firebird envenenado, un lock,
// un error del driver. Ninguno necesita a una persona — el reintento del
// teléfono los resuelve.
const CODIGOS_INFRAESTRUCTURA = new Set([
  "firebird_error",
  "firebird_lock_conflict",
  "firebird_deadlock",
]);

// Cortes de transmisión: el cuerpo llegó incompleto o no llegó. En el sistema
// esto se ve como 408/413 o como una captura marcada truncada.
const CODIGOS_SUBIDA_CORTADA = new Set([
  "body_read_failed",
  "multipart_invalido",
  "request_entity_too_large",
]);

// Los únicos status donde "el cuerpo es el problema" es una lectura honesta.
// Un 403 también trae código y también es 4xx, pero no es un cuerpo ilegible:
// es un permiso. Cae en `desconocida` y la pantalla muestra el mensaje del
// servidor, que dice la verdad, en vez de una etiqueta que miente.
const STATUS_DE_CUERPO = new Set([400, 409, 422]);

export class Causa {
  private constructor(public readonly value: CausaValue) {}

  static create(input: string): Causa | DomainError {
    if ((CAUSAS as readonly string[]).includes(input)) {
      return new Causa(input as CausaValue);
    }
    return new DomainError("causa_invalida", `causa inválida: ${input}`);
  }

  static values(): readonly CausaValue[] {
    return CAUSAS;
  }

  // desde clasifica un intento por su código de error y su status HTTP.
  //
  // El orden de las reglas importa y no es alfabético: el código manda sobre
  // el status. El mismo 422 es `falta_inventario` o `cuerpo_ilegible` según
  // el código que lo acompañe, y esa ambigüedad no es teórica — es la que
  // hace hoy que la pantalla no distinga una venta que necesita reponer
  // inventario de una que necesita corregir un campo.
  static desde(errorCode: string | null | undefined, httpStatus: number): Causa {
    const code = (errorCode ?? "").trim();

    if (CODIGOS_SIN_EXISTENCIA.has(code)) return new Causa("falta_inventario");
    if (CODIGOS_INFRAESTRUCTURA.has(code)) return new Causa("servidor_no_respondio");
    if (CODIGOS_SUBIDA_CORTADA.has(code)) return new Causa("subida_cortada");

    // Sin respuesta del servidor: 0 es "ni siquiera hubo status" (la captura
    // existe pero nadie contestó), 5xx es el servidor caído.
    if (httpStatus === 0 || httpStatus >= 500) return new Causa("servidor_no_respondio");

    if (httpStatus === 408 || httpStatus === 413) return new Causa("subida_cortada");

    // Sin código no hay nada que clasificar. Es el caso medido en producción
    // —el capturador no encuentra `code` en el problem+json y la columna
    // queda vacía— y el que obliga a que el título sea el mensaje.
    if (code === "") return new Causa("desconocida");

    if (STATUS_DE_CUERPO.has(httpStatus)) return new Causa("cuerpo_ilegible");

    return new Causa("desconocida");
  }

  // titulo es la frase que encabeza la tarjeta.
  //
  // Cuando la causa es `desconocida`, el título es el mensaje del servidor:
  // dice menos de lo que nos gustaría, pero dice algo cierto. La etiqueta
  // genérica se reserva para cuando tampoco hay mensaje.
  titulo(mensajeDelServidor?: string | null): string {
    switch (this.value) {
      case "falta_inventario":
        return "Sin existencia en almacén";
      case "servidor_no_respondio":
        return "El servidor no respondió";
      case "subida_cortada":
        return "La subida se cortó";
      case "cuerpo_ilegible":
        return "El servidor rechazó los datos";
      case "desconocida": {
        const mensaje = (mensajeDelServidor ?? "").trim();
        return mensaje === "" ? "Sin detalle del servidor" : mensaje;
      }
    }
  }

  // necesitaPersona reporta si la causa exige intervención humana. Es la
  // única entrada de Urgencia; vive aquí porque es una propiedad de la causa,
  // no de la pantalla.
  necesitaPersona(): boolean {
    return this.value === "falta_inventario" || this.value === "cuerpo_ilegible";
  }

  equals(other: Causa): boolean {
    return this.value === other.value;
  }
}
