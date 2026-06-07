import { DomainError } from "../errors";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type HttpMethodValue = (typeof HTTP_METHODS)[number];

export class HttpMethod {
  private constructor(public readonly value: HttpMethodValue) {}

  static create(input: string): HttpMethod | DomainError {
    const upper = input.toUpperCase();
    if ((HTTP_METHODS as readonly string[]).includes(upper)) {
      return new HttpMethod(upper as HttpMethodValue);
    }
    return new DomainError(
      "http_method_invalido",
      `método HTTP inválido: ${input}`,
    );
  }
}
