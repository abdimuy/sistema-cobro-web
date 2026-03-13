import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

export async function showNativeNotification(title: string, body: string): Promise<void> {
  try {
    console.log('[NativeNotification] Checking permission...');
    let permissionGranted = await isPermissionGranted();
    console.log('[NativeNotification] Permission granted:', permissionGranted);

    if (!permissionGranted) {
      console.log('[NativeNotification] Requesting permission...');
      const permission = await requestPermission();
      console.log('[NativeNotification] Permission response:', permission);
      permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
      console.log('[NativeNotification] Sending:', title, body);
      sendNotification({ title, body });
    } else {
      console.warn('[NativeNotification] Permission denied');
    }
  } catch (err) {
    console.error('[NativeNotification] Error:', err);
  }
}
