import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Settings } from "lucide-react";
import type { Actividad, Cuenta, FichaUsuario, Jornada } from "../domain/entities";
import { useUsuario } from "../presentation/hooks/useUsuario";
import { usePreferencias } from "../presentation/context/usePreferencias";
import { horaCorta } from "./lib/format";
import { mensajeSinConfigurar } from "./lib/motivoNoConfigurado";
import { ErrorConReintento, EstadoVacio } from "./comunes/Estados";
import { TableroScreen } from "./tablero/TableroScreen";
import { LineaActividad } from "./linea/LineaActividad";
import { SelectorVista } from "./linea/SelectorVista";
import { Leyenda } from "./linea/Leyenda";
import { FichaScreen } from "./ficha/FichaScreen";
import { FichaEsqueleto } from "./ficha/FichaEsqueleto";
import type { CargaFicha } from "./ficha/FichaEncabezado";
import { esPestana, type PestanaFicha } from "./ficha/pestanas";
import { RUTA_CONFIGURAR_USUARIO } from "./ficha/sinConfigurar";
import { describirActividades, type RefVenta } from "./jornada/describirActividades";
import { CeldaFotos } from "./modales/CeldaFotos";
import { ModalesFicha, type ModalFicha } from "./modales/ModalesFicha";
import { CODIGO_ZONA_EXCLUIDA } from "./ficha/conflictos";

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;

// Pantalla del módulo: tablero o ficha según `?usuario=` (sin rutas nuevas:
// ROUTE_TO_MODULE solo protege rutas exactas). La pestaña y el día también van
// en la URL (`pestana`, `dia`), así el botón "atrás" funciona.
export function DesempenoScreen({ puedeConfigurar }: { puedeConfigurar: boolean }) {
  const [params, setParams] = useSearchParams();
  const uid = params.get("usuario");
  if (!uid) {
    return <TableroScreen onAbrirUsuario={(u) => setParams({ usuario: u })} puedeConfigurar={puedeConfigurar} />;
  }
  return <FichaConectada key={uid} uid={uid} puedeConfigurar={puedeConfigurar} />;
}

// Une los carriles: ficha (carril 2) con la línea, el selector "Vista" y la
// leyenda (carril 1), y las fotos y la pila de modales (carril 3).
function FichaConectada({ uid, puedeConfigurar }: { uid: string; puedeConfigurar: boolean }) {
  const [params, setParams] = useSearchParams();
  const { periodo } = usePreferencias();
  const { ficha, error, refresh } = useUsuario(uid);
  // Al cambiar Hoy/Semana (otra consulta) useCargaRemota borra la ficha. Se
  // recuerda la última SÓLO para sostener el marco (nombre, zona, pestañas, lo
  // tecleado en Actividad); sus cifras nunca se pintan bajo otro periodo (D23).
  const [ultima, setUltima] = useState<FichaUsuario | null>(null);
  if (ficha && ficha !== ultima) setUltima(ficha);
  const candidata = ficha ?? ultima;
  const base = candidata && candidata.usuario.uid === uid ? candidata : null;
  const vigente = ficha && ficha.periodo === periodo ? ficha : null;
  const cargando = vigente === null && error === null;
  const [lento, setLento] = useState(false);
  useEffect(() => {
    if (!cargando) {
      setLento(false);
      return undefined;
    }
    const t = window.setTimeout(() => setLento(true), 1000);
    return () => window.clearTimeout(t);
  }, [cargando, periodo]);
  const { vista, horario } = usePreferencias();
  const [pila, setPila] = useState<ModalFicha[]>([]);
  const crudaPestana = params.get("pestana");
  const pestana: PestanaFicha = esPestana(crudaPestana) ? crudaPestana : "jornada";
  const crudoDia = params.get("dia") ?? "";
  // `hoy` es el del servidor (D10): la Mac no decide qué día es.
  const hoy = base?.hoy ?? "";
  const dia = FORMATO_DIA.test(crudoDia) && crudoDia <= hoy ? crudoDia : hoy;

  const cambiarParam = useCallback(
    (clave: string, valor: string) =>
      setParams((previos) => {
        const siguientes = new URLSearchParams(previos);
        siguientes.set(clave, valor);
        return siguientes;
      }),
    [setParams],
  );
  const abrir = useCallback((m: ModalFicha) => setPila((p) => [...p, m]), []);
  const abrirVenta = useCallback(
    (v: RefVenta) => abrir({ tipo: "venta", clienteId: v.clienteId, doctoPvId: v.doctoPvId }),
    [abrir],
  );
  const volver = () => setParams({});

  const volverAlEquipo = (
    <button
      type="button"
      onClick={volver}
      className="h-9 rounded-full px-4 text-[13px] ring-1 ring-border hover:bg-muted"
    >
      Volver al equipo
    </button>
  );

  if (!base) {
    if (error?.code === "desempeno_usuario_not_found") {
      return (
        <div className="flex flex-col items-center gap-3 p-10">
          <EstadoVacio
            titulo="No encontramos a este usuario"
            detalle="Puede que ya no tenga acceso o cambió de zona."
          />
          {volverAlEquipo}
        </div>
      );
    }
    if (error?.code === CODIGO_ZONA_EXCLUIDA) {
      return (
        <div className="flex flex-col items-center gap-3 p-10">
          <EstadoVacio titulo="Zona excluida" detalle={error.message} />
          {volverAlEquipo}
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-10">
          <ErrorConReintento titulo="No se pudo cargar" mensaje={error.message} onReintentar={refresh} />
        </div>
      );
    }
    return <FichaEsqueleto completo />;
  }
  const usuario = base.usuario;
  if (!usuario.configurado) {
    return (
      <div className="flex flex-col items-center gap-3 p-10">
        <EstadoVacio titulo={usuario.nombre} detalle={mensajeSinConfigurar(usuario.motivoNoConfigurado)} />
        <div className="flex items-center gap-2">
          {puedeConfigurar && (
            <Link
              to={RUTA_CONFIGURAR_USUARIO}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] ring-1 ring-border hover:bg-muted"
            >
              <Settings aria-hidden className="h-3.5 w-3.5" />
              Configurar en Usuarios
            </Link>
          )}
          {volverAlEquipo}
        </div>
      </div>
    );
  }

  const carga: CargaFicha = vigente
    ? { tipo: "lista" }
    : error
      ? { tipo: "error", mensaje: error.message, onReintentar: refresh }
      : { tipo: "cargando", mensaje: lento ? (periodo === "semana" ? "Cargando semana…" : "Cargando hoy…") : null };

  return (
    <>
      <FichaScreen
        ficha={base}
        carga={carga}
        pestana={pestana}
        dia={dia}
        onCambiarPestana={(p) => cambiarParam("pestana", p)}
        onCambiarDia={(d) => cambiarParam("dia", d)}
        onVolver={volver}
        aviso={
          error && vigente && (
            <div
              role="status"
              className="flex items-center justify-between rounded-full bg-dsm-ambar-fondo px-4 py-2 text-[13px] text-dsm-ambar"
            >
              {`No se pudo actualizar · datos de ${horaCorta(base.generadoAt)}`}
              <button type="button" onClick={refresh} className="underline underline-offset-2">
                Reintentar
              </button>
            </div>
          )
        }
        onAbrirActividad={(a: Actividad) => abrir({ tipo: "actividad", actividad: a })}
        onAbrirCuenta={(c: Cuenta) => {
          if (c.doctoPvId !== null) abrir({ tipo: "venta", clienteId: c.clienteId, doctoPvId: c.doctoPvId });
        }}
        onAbrirVenta={abrirVenta}
        renderFotos={(a) => <CeldaFotos actividad={a} />}
        renderLinea={(j: Jornada, ahora) => (
          <LineaActividad
            eje={j.eje}
            linea={j.linea}
            vista={vista}
            pausaMin={j.pausaMin}
            horario={horario}
            ahora={ahora}
            tamano="grande"
            describir={describirActividades(j.actividades)}
          />
        )}
        controlesLinea={
          <>
            <SelectorVista />
            <Leyenda vista={vista} />
          </>
        }
      />
      <ModalesFicha pila={pila} onCerrar={() => setPila((p) => p.slice(0, -1))} onAbrir={abrir} />
    </>
  );
}
