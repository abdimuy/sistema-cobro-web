import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Settings } from "lucide-react";
import type { Actividad, Cuenta, Jornada, Tablero } from "../domain/entities";
import { useTablero } from "../presentation/hooks/useTablero";
import { usePreferencias } from "../presentation/context/usePreferencias";
import { horaCorta, hoyDeNegocio } from "./lib/format";
import { mensajeSinConfigurar } from "./lib/motivoNoConfigurado";
import { ErrorConReintento, EstadoVacio } from "./comunes/Estados";
import { TableroScreen } from "./tablero/TableroScreen";
import { LineaActividad } from "./linea/LineaActividad";
import { SelectorVista } from "./linea/SelectorVista";
import { Leyenda } from "./linea/Leyenda";
import { FichaScreen } from "./ficha/FichaScreen";
import { esPestana, type PestanaFicha } from "./ficha/pestanas";
import { RUTA_CONFIGURAR_USUARIO } from "./ficha/sinConfigurar";
import { describirActividades, type RefVenta } from "./jornada/describirActividades";
import { CeldaFotos } from "./modales/CeldaFotos";
import { ModalesFicha, type ModalFicha } from "./modales/ModalesFicha";

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
  return <FichaConectada uid={uid} puedeConfigurar={puedeConfigurar} />;
}

// Une los carriles: ficha (carril 2) con la línea, el selector "Vista" y la
// leyenda (carril 1), y las fotos y la pila de modales (carril 3).
function FichaConectada({ uid, puedeConfigurar }: { uid: string; puedeConfigurar: boolean }) {
  const [params, setParams] = useSearchParams();
  const { tablero: recibido, error, refresh } = useTablero();
  // Al cambiar Hoy/Semana (otra consulta) useCargaRemota borra los datos; la
  // ficha conserva el último tablero recibido mientras llega el nuevo para no
  // desmontarse (lo tecleado en Actividad se pierde). Las cifras siguen
  // rotuladas con el periodo de SUS datos (tablero.periodo), nunca con el nuevo.
  const [ultimo, setUltimo] = useState<Tablero | null>(null);
  if (recibido && recibido !== ultimo) setUltimo(recibido);
  const tablero = recibido ?? ultimo;
  const { vista, horario } = usePreferencias();
  const [pila, setPila] = useState<ModalFicha[]>([]);
  const hoy = hoyDeNegocio();
  const crudaPestana = params.get("pestana");
  const pestana: PestanaFicha = esPestana(crudaPestana) ? crudaPestana : "jornada";
  const crudoDia = params.get("dia") ?? "";
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

  if (!tablero) {
    if (error) {
      return (
        <div className="p-10">
          <ErrorConReintento titulo="No se pudo cargar la ficha" mensaje={error.message} onReintentar={refresh} />
        </div>
      );
    }
    return <div aria-busy="true" className="m-10 h-48 animate-pulse rounded-[14px] bg-dsm-tarjeta" />;
  }
  const usuario = tablero.usuarios.find((u) => u.uid === uid);
  if (!usuario || !usuario.configurado) {
    return (
      <div className="flex flex-col items-center gap-3 p-10">
        <EstadoVacio
          titulo={usuario ? usuario.nombre : "No encontramos a este usuario"}
          detalle={
            usuario
              ? mensajeSinConfigurar(usuario.motivoNoConfigurado)
              : "Puede que ya no tenga acceso o cambió de zona."
          }
        />
        <div className="flex items-center gap-2">
          {usuario && puedeConfigurar && (
            <Link
              to={RUTA_CONFIGURAR_USUARIO}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] ring-1 ring-border hover:bg-muted"
            >
              <Settings aria-hidden className="h-3.5 w-3.5" />
              Configurar en Usuarios
            </Link>
          )}
          <button
            type="button"
            onClick={volver}
            className="h-9 rounded-full px-4 text-[13px] ring-1 ring-border hover:bg-muted"
          >
            Volver al equipo
          </button>
        </div>
      </div>
    );
  }

  const opcionesRegistro = tablero.usuarios
    .filter((u) => u.configurado && u.zonaId === usuario.zonaId)
    .map((u) => ({ valor: u.uid, etiqueta: u.nombre }));

  return (
    <>
      <FichaScreen
        usuario={usuario}
        periodo={tablero.periodo}
        generadoAt={tablero.generadoAt}
        opcionesRegistro={opcionesRegistro}
        pestana={pestana}
        dia={dia}
        hoy={hoy}
        onCambiarPestana={(p) => cambiarParam("pestana", p)}
        onCambiarDia={(d) => cambiarParam("dia", d)}
        onVolver={volver}
        aviso={
          error && (
            <div
              role="status"
              className="flex items-center justify-between rounded-full bg-dsm-ambar-fondo px-4 py-2 text-[13px] text-dsm-ambar"
            >
              {`No se pudo actualizar · datos de ${horaCorta(tablero.generadoAt)}`}
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
