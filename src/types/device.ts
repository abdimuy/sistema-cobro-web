import { Timestamp } from "firebase/firestore";

export interface DeviceSystemInfo {
  os?: string;
  osVersion?: string;
  hostname?: string;
  arch?: string;
  cpu?: string;
  ram?: string;
  username?: string;
  screenResolution?: string;
}

export interface AuthorizedDevice {
  id: string;
  deviceId: string;
  platform: "android" | "desktop";
  label: string;
  authorizedAt: Timestamp;
  authorizedBy: string;
  systemInfo?: DeviceSystemInfo;
  // Android fields
  manufacturer?: string;
  model?: string;
  brand?: string;
  androidVersion?: string;
  sdkVersion?: number;
  product?: string;
  device?: string;
  language?: string;
}

export interface PendingDevice {
  deviceId: string;
  platform: "android" | "desktop";
  label: string;
  requestedAt: Timestamp;
  userId: string;
  systemInfo?: DeviceSystemInfo;
  // Android fields
  manufacturer?: string;
  model?: string;
  brand?: string;
  androidVersion?: string;
  sdkVersion?: number;
  product?: string;
  device?: string;
  language?: string;
}
