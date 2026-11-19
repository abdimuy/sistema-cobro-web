import type { Segmento } from "../../domain/values/Coincidencia";

interface Props {
  segmentos?: Segmento[];
  aproximada?: boolean;
  texto: string;
}

export function TextoResaltado({ segmentos, aproximada, texto }: Props) {
  if (!segmentos || segmentos.length === 0) return <>{texto}</>;
  const clase = aproximada ? "coincide-aprox" : "coincide";
  return (
    <>
      {segmentos.map((s, i) =>
        s.coincide ? (
          <mark key={i} className={clase}>
            {s.texto}
          </mark>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}
