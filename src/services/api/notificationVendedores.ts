import axios from 'axios';
import { URL_API } from '../../constants/api';

export interface UsuarioFirebase {
  email: string;
  nombre: string;
  zonaClienteId: number;
}

export interface VendedoresResponse {
  email: string;
  vendedores: string[];
}

export async function getUsuariosFirebase(): Promise<UsuarioFirebase[]> {
  const response = await axios.get<UsuarioFirebase[]>(
    `${URL_API}/notificaciones/usuarios-firebase`
  );
  return response.data;
}

export async function getVendedoresAsignados(email: string): Promise<VendedoresResponse> {
  const response = await axios.get<VendedoresResponse>(
    `${URL_API}/notificaciones/vendedores/${encodeURIComponent(email)}`
  );
  return response.data;
}

export async function updateVendedoresAsignados(email: string, vendedores: string[]): Promise<VendedoresResponse> {
  const response = await axios.put<VendedoresResponse>(
    `${URL_API}/notificaciones/vendedores`,
    { email, vendedores }
  );
  return response.data;
}
