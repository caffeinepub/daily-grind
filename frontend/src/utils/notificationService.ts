const SW_PATH = '/sw.js';

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
    swRegistration = registration;
    return registration;
  } catch {
    return null;
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

async function getActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    return reg ?? null;
  } catch {
    return null;
  }
}

async function sendMessageToSW(message: { type: string }): Promise<void> {
  const reg = await getActiveRegistration();
  if (!reg) return;

  const sw = reg.active ?? reg.waiting ?? reg.installing;
  if (!sw) return;

  sw.postMessage(message);
}

export async function startNotificationSchedule(): Promise<void> {
  await sendMessageToSW({ type: 'START_NOTIFICATIONS' });
}

export async function stopNotificationSchedule(): Promise<void> {
  await sendMessageToSW({ type: 'STOP_NOTIFICATIONS' });
}

export async function sendTestNotification(): Promise<void> {
  await sendMessageToSW({ type: 'SHOW_TEST_NOTIFICATION' });
}
