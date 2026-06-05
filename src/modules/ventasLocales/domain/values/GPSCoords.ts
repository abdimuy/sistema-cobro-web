import { DomainError } from "../errors";

export class GPSCoords {
  private constructor(
    public readonly latitud: number,
    public readonly longitud: number,
  ) {}

  static create(latitud: number, longitud: number): GPSCoords | DomainError {
    if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
      return new DomainError("gps_fuera_de_rango", "las coordenadas gps están fuera del rango válido");
    }
    return new GPSCoords(latitud, longitud);
  }

  static zero(): GPSCoords {
    return new GPSCoords(0, 0);
  }
}
