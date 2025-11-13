import { useState } from "react";
import { db, secondaryAuth } from "../../../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import useGetRutas from "./useGetRutas";
import { Ruta } from "../../services/api/getRutas";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import { ZonaCliente } from "../../services/api/getZonasCliente";
import { CobradorDto } from "../../hooks/useGetCobradores";
import useGetZonasCliente from "./useGetZonaCliente";
import { androidModules } from "../../constants/androidModules";

const CreateUser = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [ruta, setRuta] = useState<Ruta>();
  const [telefono, setTelefono] = useState<string>("");
  const [zonaCliente, setZonaCliente] = useState<ZonaCliente>();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const navigate = useNavigate();

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

      // Sign out the newly created user immediately to keep admin session active
      await signOut(secondaryAuth);

      setMessage("Usuario registrado exitosamente.");

      // Reset form
      setEmail("");
      setPassword("");
      setName("");
      setTelefono("");
      setSelectedModules([]);

      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate("/settings");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating user:", error);
      setMessage(
        error.code === "auth/email-already-in-use"
          ? "Este correo ya está registrado."
          : error.code === "auth/weak-password"
          ? "La contraseña debe tener al menos 6 caracteres."
          : error.code === "auth/invalid-email"
          ? "El correo electrónico no es válido."
          : "Error al registrar el usuario. Intenta nuevamente."
      );
    }
  };

  return (
    <div
      className="w-full h-full bg-white overflow-y-auto"
      style={{ height: "100vh" }}
    >
      <div className="flex justify-center flex-col items-center min-h-full py-8">
        <button
          onClick={() => navigate("/settings")}
          className="self-start ml-8 mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
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
        <h2 className="text-3xl text-black font-bold text-center mb-12">
          Crear usuario
        </h2>
      <input
        type="name"
        className="mb-6 bg-gray-100 p-2 rounded text-black w-[21.5rem]"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        className="mb-6 bg-gray-100 p-2 rounded text-black w-[21.5rem]"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="mb-8 bg-gray-100 p-2 rounded text-black w-[21.5rem]"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="tel"
        className="mb-8 bg-gray-100 p-2 rounded text-black w-[21.5rem]"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />
      <p className="text-black text-center font-bold text-xl mb-4">Ruta</p>
      <select
        className="mb-8 bg-gray-100 p-2 rounded text-black w-[21.5rem]"
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
      <p className="text-black text-center font-bold text-xl mb-4">Módulos</p>
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
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {module.label.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="text-black text-center font-bold text-xl mb-4">Zona</p>
      <select
        className="mb-8 bg-gray-100 p-2 rounded text-black w-[21.5rem]"
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
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleRegister}
      >
        Crear usuario
      </button>
      <p
        className={`text-center mt-4 text-sm ${
          message.includes("Error") ? "text-red-500" : "text-green-500"
        }`}
      >
        {message}
      </p>
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
      
      {/* Navegación profesional */}
      <Navigation />
    </div>
  );
};

export default CreateUser;
