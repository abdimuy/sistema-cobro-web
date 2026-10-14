// DomainError sigue la convención apperror del backend: `code` estable en
// inglés snake_case y `message` en español para la persona.
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "DomainError";
  }
}
