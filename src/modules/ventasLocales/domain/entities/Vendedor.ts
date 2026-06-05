export class Vendedor {
  private constructor(
    public readonly id: string,
    public readonly usuarioID: string,
    public readonly email: string,
    public readonly nombre: string,
  ) {}

  static create(input: {
    id: string;
    usuarioID: string;
    email: string;
    nombre: string;
  }): Vendedor {
    return new Vendedor(input.id, input.usuarioID, input.email, input.nombre);
  }
}
