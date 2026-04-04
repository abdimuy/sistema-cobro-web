import { invoke } from "@tauri-apps/api/core";
import { DeviceSystemInfo } from "../types/device";

export interface DeviceInfo {
  deviceId: string;
  label: string;
  platform: "android" | "desktop";
  systemInfo?: DeviceSystemInfo;
}

export async function getDeviceFingerprint(): Promise<DeviceInfo> {
  try {
    const fingerprint = await invoke<string>("get_device_fingerprint");
    const deviceLabel = await invoke<string>("get_device_label");
    const systemInfo = await invoke<DeviceSystemInfo>("get_device_info");

    return {
      deviceId: fingerprint,
      label: deviceLabel || "Desktop",
      platform: "desktop",
      systemInfo,
    };
  } catch (error) {
    console.error("Error getting device fingerprint:", error);
    let fallbackId = localStorage.getItem("device_fingerprint");
    if (!fallbackId) {
      fallbackId = crypto.randomUUID();
      localStorage.setItem("device_fingerprint", fallbackId);
    }
    return {
      deviceId: fallbackId,
      label: "Desktop (ID temporal)",
      platform: "desktop",
    };
  }
}
