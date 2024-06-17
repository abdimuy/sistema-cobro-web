import { useState } from "react";
import { auth, db } from "../../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import useGetRutas from "./useGetRutas";
import { Ruta } from "../../services/api/getRutas";
import { useNavigate } from "react-router-dom";

const CreateUser = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [ruta, setRuta] = useState<Ruta>();
  const navigate = useNavigate();

  const { rutas, error } = useGetRutas();

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setMessage("Usuario registrado exitosamente.");

      // Guarda información adicional del usuario en Firestore si es necesario
      await setDoc(doc(db, "users", user.uid), {
        EMAIL: email,
        CREATED_AT: Timestamp.now(),
        COBRADOR_ID: ruta?.COBRADOR_ID,
        NOMBRE: name,
        P: password,
        FECHA_CARGA_INICIAL: Timestamp.now(),
      });
      navigate("/settings");
    } catch (error) {
      setMessage("Error al registrar el usuario.");
    }
  };

  return (
    <div
      className="w-full h-full flex justify-center flex-col items-center bg-white"
      style={{ height: "100vh" }}
    >
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
      <p className="text-black text-center font-bold text-xl mb-4">Ruta</p>
      <select
        className="mb-8 bg-gray-100 p-2 rounded text-black"
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
  );
};

export default CreateUser;
