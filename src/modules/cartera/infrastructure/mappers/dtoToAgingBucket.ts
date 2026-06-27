import type { AgingBucket } from "../../domain/entities/AgingBucket";
import type { AgingBucketDTO } from "../http/dtos";

export function dtoToAgingBucket(dto: AgingBucketDTO): AgingBucket {
  return {
    bucket: dto.bucket,
    saldo: dto.saldo,
    conteo: dto.conteo,
    pctSaldo: dto.pct_saldo,
  };
}
