import type { SegmentoValue } from "../../domain/values";

export type ListarWinbackInput = {
  segmento?: SegmentoValue;
  zona?: string;
  limit?: number;
  incluirControl?: boolean;
  incluirActivos?: boolean;
};
