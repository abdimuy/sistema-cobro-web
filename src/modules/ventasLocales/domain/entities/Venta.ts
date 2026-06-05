import type { Direccion } from "../values/Direccion";
import type { GPSCoords } from "../values/GPSCoords";
import type { Monto } from "../values/Monto";
import type { PlanCredito } from "../values/PlanCredito";
import type { DiaCobranza } from "../values/DiaCobranza";
import type { ClienteSnapshot } from "./ClienteSnapshot";
import type { Producto } from "./Producto";
import type { Combo } from "./Combo";
import type { Vendedor } from "./Vendedor";
import type { ImagenExistente } from "./Imagen";

export type SituacionVenta = "borrador" | "revisada" | "aprobada" | "cancelada";
export type Sincronizacion = "pendiente" | "aplicada";
export type EstadoVenta = "active" | "deleted";
export type TipoVenta = "CONTADO" | "CREDITO";

export type Montos = { anual: Monto; cortoPlazo: Monto; contado: Monto };

export class Venta {
  private constructor(
    public readonly id: string,
    public readonly cliente: ClienteSnapshot,
    public readonly direccion: Direccion,
    public readonly gps: GPSCoords,
    public readonly fechaVenta: string,
    public readonly tipoVenta: TipoVenta,
    public readonly estado: EstadoVenta,
    public readonly situacion: SituacionVenta,
    public readonly sincronizacion: Sincronizacion,
    public readonly montos: Montos,
    public readonly planCredito: PlanCredito | null,
    public readonly diaCobranza: DiaCobranza | null,
    public readonly nota: string | null,
    public readonly combos: ReadonlyArray<Combo>,
    public readonly productos: ReadonlyArray<Producto>,
    public readonly vendedores: ReadonlyArray<Vendedor>,
    public readonly imagenes: ReadonlyArray<ImagenExistente>,
    public readonly microsipFolio: string | null,
    public readonly microsipDoctoPVID: number | null,
    public readonly microsipAplicadaAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly createdBy: string,
    public readonly updatedBy: string,
  ) {}

  static create(input: {
    id: string;
    cliente: ClienteSnapshot;
    direccion: Direccion;
    gps: GPSCoords;
    fechaVenta: string;
    tipoVenta: TipoVenta;
    estado: EstadoVenta;
    situacion: SituacionVenta;
    sincronizacion: Sincronizacion;
    montos: Montos;
    planCredito: PlanCredito | null;
    diaCobranza: DiaCobranza | null;
    nota: string | null;
    combos: ReadonlyArray<Combo>;
    productos: ReadonlyArray<Producto>;
    vendedores: ReadonlyArray<Vendedor>;
    imagenes: ReadonlyArray<ImagenExistente>;
    microsipFolio: string | null;
    microsipDoctoPVID: number | null;
    microsipAplicadaAt: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  }): Venta {
    return new Venta(
      input.id,
      input.cliente,
      input.direccion,
      input.gps,
      input.fechaVenta,
      input.tipoVenta,
      input.estado,
      input.situacion,
      input.sincronizacion,
      input.montos,
      input.planCredito,
      input.diaCobranza,
      input.nota,
      input.combos,
      input.productos,
      input.vendedores,
      input.imagenes,
      input.microsipFolio,
      input.microsipDoctoPVID,
      input.microsipAplicadaAt,
      input.createdAt,
      input.updatedAt,
      input.createdBy,
      input.updatedBy,
    );
  }

  canEdit(): boolean {
    return this.situacion === "borrador" && this.estado === "active";
  }

  isCredito(): boolean {
    return this.tipoVenta === "CREDITO";
  }

  withCliente(c: ClienteSnapshot): Venta {
    return new Venta(
      this.id, c, this.direccion, this.gps, this.fechaVenta,
      this.tipoVenta, this.estado, this.situacion, this.sincronizacion,
      this.montos, this.planCredito, this.diaCobranza, this.nota,
      this.combos, this.productos, this.vendedores, this.imagenes,
      this.microsipFolio, this.microsipDoctoPVID, this.microsipAplicadaAt,
      this.createdAt, this.updatedAt, this.createdBy, this.updatedBy,
    );
  }

  withHeader(input: {
    direccion: Direccion;
    gps: GPSCoords;
    fechaVenta: string;
    montos: Montos;
    planCredito: PlanCredito | null;
    diaCobranza: DiaCobranza | null;
    nota: string | null;
  }): Venta {
    return new Venta(
      this.id, this.cliente, input.direccion, input.gps, input.fechaVenta,
      this.tipoVenta, this.estado, this.situacion, this.sincronizacion,
      input.montos, input.planCredito, input.diaCobranza, input.nota,
      this.combos, this.productos, this.vendedores, this.imagenes,
      this.microsipFolio, this.microsipDoctoPVID, this.microsipAplicadaAt,
      this.createdAt, this.updatedAt, this.createdBy, this.updatedBy,
    );
  }

  withProductos(productos: ReadonlyArray<Producto>): Venta {
    return new Venta(
      this.id, this.cliente, this.direccion, this.gps, this.fechaVenta,
      this.tipoVenta, this.estado, this.situacion, this.sincronizacion,
      this.montos, this.planCredito, this.diaCobranza, this.nota,
      this.combos, productos, this.vendedores, this.imagenes,
      this.microsipFolio, this.microsipDoctoPVID, this.microsipAplicadaAt,
      this.createdAt, this.updatedAt, this.createdBy, this.updatedBy,
    );
  }

  withCombos(combos: ReadonlyArray<Combo>): Venta {
    return new Venta(
      this.id, this.cliente, this.direccion, this.gps, this.fechaVenta,
      this.tipoVenta, this.estado, this.situacion, this.sincronizacion,
      this.montos, this.planCredito, this.diaCobranza, this.nota,
      combos, this.productos, this.vendedores, this.imagenes,
      this.microsipFolio, this.microsipDoctoPVID, this.microsipAplicadaAt,
      this.createdAt, this.updatedAt, this.createdBy, this.updatedBy,
    );
  }

  withImagenes(imagenes: ReadonlyArray<ImagenExistente>): Venta {
    return new Venta(
      this.id, this.cliente, this.direccion, this.gps, this.fechaVenta,
      this.tipoVenta, this.estado, this.situacion, this.sincronizacion,
      this.montos, this.planCredito, this.diaCobranza, this.nota,
      this.combos, this.productos, this.vendedores, imagenes,
      this.microsipFolio, this.microsipDoctoPVID, this.microsipAplicadaAt,
      this.createdAt, this.updatedAt, this.createdBy, this.updatedBy,
    );
  }
}
