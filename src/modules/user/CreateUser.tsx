import { useMemo, useState } from "react";
import { db, secondaryAuth } from "../../../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import useGetRutas from "./useGetRutas";
import { Ruta } from "../../services/api/getRutas";
import { useNavigate } from "react-router-dom";

import { ZonaCliente } from "../../services/api/getZonasCliente";
import { CobradorDto } from "../../hooks/useGetCobradores";
import useGetZonasCliente from "./useGetZonaCliente";
import { androidModules } from "../../constants/androidModules";
import { apiClient } from "./infrastructure/http/apiClient";
import { HttpUserAdapter } from "./infrastructure/http/HttpUserAdapter";
import { crearUsuario } from "./application/usecases/crearUsuario";
import { DomainError } from "./domain/errors";

// Un alta toca TRES sistemas y ninguno sabe de los otros: Firebase Auth (el
// login), Firestore (lo que lee la app Android) y el API Go (MSP_USUARIOS, de
// donde salen las pantallas de Vendedores y de Usuarios y roles). Saltarse el
// tercero fue el defecto: cinco personas se dieron de alta y ninguna apareció
// en Vendedores.
const MSG_OK = "Usuario registrado exitosamente.";

// El color del aviso lo decide `tono`, NO el texto. Antes se decidía con
// `message.includes("Error")`, y los tres mensajes de error de Firebase de
// más abajo no llevan esa palabra: la oficina los estaba viendo en VERDE.
// Sniffear el texto para elegir el color vuelve a romperse con cada mensaje
// nuevo, así que el estado lleva la intención explícita.
type Tono = "ok" | "error";

// mensajeSinApi dice las DOS cosas que la operadora necesita: que el usuario
// SÍ quedó creado (Firebase y Firestore ya están escritos y no se deshacen) y
// que falta registrarlo en el API. `razon` viene del DomainError del
// adaptador — sin ella el aviso es el mismo para un permiso faltante que para
// un teléfono demasiado largo, y no hay nada que corregir a ciegas.
const mensajeSinApi = (razon?: string) =>
  razon
    ? `Error: ${razon}. El usuario sí se creó; falta registrarlo.`
    : "Error al registrarlo en el sistema. El usuario sí se creó.";

// El 409 NO es "falta registrarlo": la colisión es contra una fila que ya
// está en MSP_USUARIOS, y volver a capturarla no arregla nada.
//
// El caso que ANTES era el frecuente ya no llega aquí: cuando un cobrador
// nombra a alguien vendedor desde el teléfono, el API crea la fila al vuelo
// con ESTATUS = VENDEDOR_ONLY (internal/auth/domain/usuario.go:90), y desde
// ahora POST /v2/usuarios la PROMUEVE en sitio — engancha el firebase_uid,
// la pasa a FIREBASE_USER conservando el id, y contesta 201. No hay aviso.
//
// Lo que queda bajo el 409 son tres colisiones que NO se resuelven solas al
// iniciar sesión, y el API devuelve el MISMO código para las tres
// (domain.ErrUsuarioYaExiste → code "usuario_ya_existe",
// internal/auth/domain/errors.go:23) sin exponer cuál fue:
//
//  1. el correo pertenece a una fila DESACTIVADA — reactivarla es una
//     decisión de oficina, deliberada;
//  2. el correo ya es un FIREBASE_USER atado a otra cuenta de Firebase;
//  3. el firebase_uid recién creado ya lo usa otra fila.
//
// Por eso el texto no promete nada automático: sólo dice que el alta en
// Firebase sí ocurrió y que alguien tiene que revisarlo. Prometer que "queda
// listo al iniciar sesión" —lo que decía antes— es peor que un mensaje
// genérico: manda a la operadora a esperar algo que no va a pasar.
const MSG_YA_EXISTIA =
  "Error: el registro ya existe. El usuario sí se creó; requiere revisión manual.";

const NAVEGAR_MS = 1500;
// En el camino de fallo el mensaje dice que hay algo que hacer (registrar al
// usuario a mano, o pedir que revisen la colisión), así que se le da tiempo de
// sobra para leerlo antes de salir de la pantalla.
const NAVEGAR_MS_FALLO = 8000;

const CreateUser = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [tono, setTono] = useState<Tono>("ok");
  const [ruta, setRuta] = useState<Ruta>();
  const [telefono, setTelefono] = useState<string>("");
  const [zonaCliente, setZonaCliente] = useState<ZonaCliente>();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const navigate = useNavigate();

  // Raíz de composición del módulo: el adaptador HTTP se instancia una sola
  // vez y el caso de uso sólo conoce el puerto.
  const userPort = useMemo(() => new HttpUserAdapter(apiClient), []);

  const { rutas, error } = useGetRutas();
  const { zonasCliente } = useGetZonasCliente();

  const handleRegister = async () => {
    try {
      // Create the new user with the secondary auth instance
      // This prevents logging out the current admin session
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const user = userCredential.user;

      // Save additional user information to Firestore
      const data: CobradorDto & { MODULOS: string[] } = {
        EMAIL: email,
        CREATED_AT: Timestamp.now(),
        COBRADOR_ID: ruta ? ruta.COBRADOR_ID : rutas[0].COBRADOR_ID,
        NOMBRE: name,
        FECHA_CARGA_INICIAL: Timestamp.now(),
        ZONA_CLIENTE_ID: zonaCliente
          ? zonaCliente.ZONA_CLIENTE_ID
          : zonasCliente[0].ZONA_CLIENTE_ID,
        TELEFONO: telefono,
        MODULOS: selectedModules,
      };
      await setDoc(doc(db, "users", user.uid), data);

      // Tercer paso: registrar el alta en el API (MSP_USUARIOS). Va aquí,
      // entre el setDoc y el signOut, para no depender del orden de dos SDKs
      // distintos. El token que viaja es el del ADMIN que opera la pantalla
      // (apiClient usa `auth`, nunca `secondaryAuth`), que es lo correcto para
      // el created_by del API.
      let altaEnApi = true;
      let razonFallo: string | undefined;
      let codigoFallo: string | undefined;
      try {
        await crearUsuario(userPort, {
          firebaseUid: user.uid,
          email,
          nombre: name,
          telefono: telefono.trim() || undefined,
        });
      } catch (apiError) {
        // Firebase y Firestore ya están escritos y no se deshacen: el alta NO
        // se considera fallida. Se avisa y se sigue. Nada de reintentos en
        // bucle — lo que hace falta es que alguien lo vea.
        altaEnApi = false;
        codigoFallo = apiError instanceof DomainError ? apiError.code : undefined;
        razonFallo =
          apiError instanceof Error && apiError.message
            ? apiError.message
            : undefined;
        console.error("Error registrando el usuario en el API:", apiError);
      }

      // Sign out the newly created user immediately to keep admin session active
      await signOut(secondaryAuth);

      if (altaEnApi) {
        setMessage(MSG_OK);
        setTono("ok");
      } else {
        setMessage(
          codigoFallo === "usuario_ya_existe"
            ? MSG_YA_EXISTIA
            : mensajeSinApi(razonFallo)
        );
        setTono("error");
      }

      // Reset form
      setEmail("");
      setPassword("");
      setName("");
      setTelefono("");
      setSelectedModules([]);

      // Navigate after a short delay to show the message
      setTimeout(
        () => {
          navigate("/settings");
        },
        altaEnApi ? NAVEGAR_MS : NAVEGAR_MS_FALLO
      );
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      // Los tres primeros no llevaban la palabra "Error" y se pintaban en
      // verde. Ahora el color lo fija `tono`; la palabra se conserva porque
      // además hace el aviso legible por sí solo.
      setMessage(
        code === "auth/email-already-in-use"
          ? "Error: este correo ya está registrado."
          : code === "auth/weak-password"
          ? "Error: la contraseña necesita 6 caracteres."
          : code === "auth/invalid-email"
          ? "Error: el correo no es válido."
          : "Error al registrar el usuario. Intenta nuevamente."
      );
      setTono("error");
    }
  };

  return (
    <div
      className="w-full h-full bg-background overflow-y-auto"
      style={{ height: "100vh" }}
    >
      <div className="flex justify-center flex-col items-center min-h-full py-8">
        <button
          onClick={() => navigate("/settings")}
          className="self-start ml-8 mb-4 text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Regresar
        </button>
        <h2 className="text-3xl text-foreground font-bold text-center mb-12">
          Crear usuario
        </h2>
      <input
        type="name"
        className="mb-6 bg-muted p-2 rounded text-foreground w-[21.5rem]"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        className="mb-6 bg-muted p-2 rounded text-foreground w-[21.5rem]"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="mb-8 bg-muted p-2 rounded text-foreground w-[21.5rem]"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="tel"
        className="mb-8 bg-muted p-2 rounded text-foreground w-[21.5rem]"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />
      <p className="text-foreground text-center font-bold text-xl mb-4">Ruta</p>
      <select
        className="mb-8 bg-muted p-2 rounded text-foreground w-[21.5rem]"
        value={ruta?.COBRADOR_ID}
        onChange={(e) => {
          const selectedRuta = rutas.find(
            (ruta) => ruta.COBRADOR_ID === Number(e.target.value)
          );
          setRuta(selectedRuta);
        }}
      >
        {rutas.map((ruta) => (
          <option key={ruta.COBRADOR_ID} value={ruta.COBRADOR_ID}>
            {ruta.COBRADOR}
          </option>
        ))}
      </select>
      <p className="text-foreground text-center font-bold text-xl mb-4">Módulos</p>
      <div className="mb-8 w-[21.5rem] flex gap-3">
        {androidModules.map((module) => (
          <button
            key={module.key}
            type="button"
            onClick={() => {
              if (selectedModules.includes(module.key)) {
                setSelectedModules(selectedModules.filter(m => m !== module.key));
              } else {
                setSelectedModules([...selectedModules, module.key]);
              }
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              selectedModules.includes(module.key)
                ? "bg-green-500 text-white shadow-lg transform scale-105"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {module.label.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="text-foreground text-center font-bold text-xl mb-4">Zona</p>
      <select
        className="mb-8 bg-muted p-2 rounded text-foreground w-[21.5rem]"
        value={zonaCliente?.ZONA_CLIENTE_ID}
        onChange={(e) => {
          const selectedZona = zonasCliente.find(
            (zona) => zona.ZONA_CLIENTE_ID === Number(e.target.value)
          );
          setZonaCliente(selectedZona);
        }}
      >
        {zonasCliente.map((zona) => (
          <option key={zona.ZONA_CLIENTE_ID} value={zona.ZONA_CLIENTE_ID}>
            {zona.ZONA_CLIENTE}
          </option>
        ))}
      </select>
      <button
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded"
        onClick={handleRegister}
      >
        Crear usuario
      </button>
      <p
        className={`text-center mt-4 text-sm ${
          tono === "error" ? "text-red-500" : "text-green-500"
        }`}
      >
        {message}
      </p>
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default CreateUser;
