import axios, { type AxiosInstance } from "axios";
import { URL_API_V2 } from "../../../../constants/api";
import { auth } from "../../../../../firebase";

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${URL_API_V2}/v2`,
  timeout: 45_000,
});

apiClient.interceptors.request.use(async (config) => {
  await auth.authStateReady();

  const token = await auth.currentUser?.getIdToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
