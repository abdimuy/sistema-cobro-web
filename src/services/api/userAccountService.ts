import axios from "axios";
import { URL_API } from "../../constants/api";

export interface UserAuthInfo {
  uid: string;
  disabled: boolean;
  lastSignIn: string | null;
  creationTime: string | null;
}

export async function getUsersAuthInfo(): Promise<UserAuthInfo[]> {
  const response = await axios.get(`${URL_API}/usuarios`);
  const { error, body } = response.data;
  if (error) throw new Error(error);
  return body.map((user: any) => ({
    uid: user.uid,
    disabled: user.disabled,
    lastSignIn: user.lastSignIn ?? null,
    creationTime: user.creationTime ?? null,
  }));
}

export async function changePassword(
  uid: string,
  newPassword: string
): Promise<void> {
  const response = await axios.put(`${URL_API}/usuarios/${uid}/password`, {
    newPassword,
  });
  const { error } = response.data;
  if (error) throw new Error(error);
}

export async function setUserStatus(
  uid: string,
  disabled: boolean
): Promise<void> {
  const response = await axios.put(`${URL_API}/usuarios/${uid}/status`, {
    disabled,
  });
  const { error } = response.data;
  if (error) throw new Error(error);
}

export async function deleteUser(uid: string): Promise<void> {
  const response = await axios.delete(`${URL_API}/usuarios/${uid}`);
  const { error } = response.data;
  if (error) throw new Error(error);
}
