import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Periodo } from "../../domain/entities";
import type {
  ConsultaJornada,
  ConsultaTablero,
  Horario,
} from "../../application/ports/DesempenoPort";
import {
  CLAVE_PAUSA_MIN,
  CLAVE_VISTA_LINEA,
  esPausaMinValida,
  esVistaLinea,
  PAUSA_MIN_PREDETERMINADA,
  VISTA_LINEA_PREDETERMINADA,
  type PreferenciasDesempeno,
  type ValorPreferencias,
  type VistaLinea,
} from "../preferencias";
import { escribirLocal, leerLocal } from "../hooks/lib/almacenLocal";
import { PreferenciasContext } from "./contextos";

export function PreferenciasProvider({
  iniciales,
  children,
}: {
  iniciales?: Partial<PreferenciasDesempeno>;
  children: ReactNode;
}) {
  const [periodo, setPeriodo] = useState<Periodo>(iniciales?.periodo ?? "hoy");
  const [pausaMin, setPausaMinEstado] = useState<number>(
    () =>
      iniciales?.pausaMin ??
      leerLocal(CLAVE_PAUSA_MIN, PAUSA_MIN_PREDETERMINADA, esPausaMinValida),
  );
  const [horario, setHorario] = useState<Horario | null>(iniciales?.horario ?? null);
  const [vista, setVistaEstado] = useState<VistaLinea>(
    () =>
      iniciales?.vista ??
      leerLocal(CLAVE_VISTA_LINEA, VISTA_LINEA_PREDETERMINADA, esVistaLinea),
  );

  const setVista = useCallback((v: VistaLinea) => {
    setVistaEstado(v);
    escribirLocal(CLAVE_VISTA_LINEA, v);
  }, []);

  // Defensa en profundidad: un valor fuera del contrato (5–240, entero) nunca
  // llega a la consulta ni se guarda; el control ya lo avisa antes.
  const setPausaMin = useCallback((m: number) => {
    if (!esPausaMinValida(m)) return;
    setPausaMinEstado(m);
    escribirLocal(CLAVE_PAUSA_MIN, m);
  }, []);

  const consultaJornada = useMemo<ConsultaJornada>(
    () => ({ pausaMin, horario }),
    [pausaMin, horario],
  );
  const consultaTablero = useMemo<ConsultaTablero>(
    () => ({ periodo, pausaMin, horario }),
    [periodo, pausaMin, horario],
  );

  const valor = useMemo<ValorPreferencias>(
    () => ({
      periodo,
      pausaMin,
      horario,
      vista,
      consultaJornada,
      consultaTablero,
      setPeriodo,
      setPausaMin,
      setHorario,
      setVista,
    }),
    [periodo, pausaMin, horario, vista, consultaJornada, consultaTablero, setPausaMin, setVista],
  );

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}
