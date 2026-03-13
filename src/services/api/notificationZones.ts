import axios from 'axios';
import { URL_API } from '../../constants/api';

export interface NotificationZonesResponse {
  email: string;
  zonas: number[];
}

export async function getNotificationZones(email: string): Promise<NotificationZonesResponse> {
  const response = await axios.get<NotificationZonesResponse>(
    `${URL_API}/notificaciones/zonas/${encodeURIComponent(email)}`
  );
  return response.data;
}

export async function updateNotificationZones(email: string, zonas: number[]): Promise<NotificationZonesResponse> {
  const response = await axios.put<NotificationZonesResponse>(
    `${URL_API}/notificaciones/zonas`,
    { email, zonas }
  );
  return response.data;
}
