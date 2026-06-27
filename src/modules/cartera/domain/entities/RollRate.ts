export type RollRate = {
  readonly disponible: boolean;
  readonly rollRate: number;
  readonly fechaCorteAnterior: Date | null;
  readonly fechaCorteReciente: Date | null;
};
