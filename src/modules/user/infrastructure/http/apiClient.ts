import axios, { AxiosInstance } from "axios";
import { URL_API_V2 } from "../../../../constants/api";
import { auth } from "../../../../../firebase";

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${URL_API_V2}/v2`,
});

apiClient.interceptors.request.use(async (config) => {
  // Espera a que Firebase restaure la sesión antes de leer el token. Sin
  // esto, un fetch en el primer render tras un hard-refresh sale sin token
  // (auth.currentUser aún es null) y el backend responde 401.
  //
  // OJO: `auth` es SIEMPRE la app primaria (la del admin que opera la
  // pantalla), nunca `secondaryAuth`. El alta de un usuario se autentica con
  // la sesión de la oficina — es lo que el API guarda como `created_by`.
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});
