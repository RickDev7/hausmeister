"use client";

import { buildPushSchedule } from "@/lib/notification-schedule";
import {
  getAllAddresses,
  getAllCollections,
  getSettings,
} from "@/lib/db";
import { buildAddressMap } from "@/lib/address-map";
import { generateId } from "@/lib/utils";

const DEVICE_ID_KEY = "muellplaner-device-id";

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export async function getVapidPublicKeyFromServer(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/vapid-public-key");
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    return data.publicKey ?? null;
  } catch {
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const publicKey = await getVapidPublicKeyFromServer();
  if (!publicKey) return null;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  return subscription;
}

export async function registerBackgroundPushSchedule(): Promise<boolean> {
  if (Notification.permission !== "granted") return false;

  const subscription = await subscribeToPushNotifications();
  if (!subscription) return false;

  const [addresses, collections, settings] = await Promise.all([
    getAllAddresses(),
    getAllCollections(),
    getSettings(),
  ]);

  if (!settings.notifications.enabled) return false;

  const addressMap = buildAddressMap(addresses);
  const schedules = buildPushSchedule(collections, addressMap, settings.notifications);

  const res = await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      subscription: subscription.toJSON(),
      schedules,
    }),
  });

  return res.ok;
}

export async function unregisterBackgroundPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  await fetch("/api/push/unregister", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: getDeviceId() }),
  }).catch(() => undefined);
}

export async function registerPeriodicBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if ("periodicSync" in registration) {
      await (registration as ServiceWorkerRegistration & {
        periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
      }).periodicSync.register("check-collections", {
        minInterval: 60 * 60 * 1000,
      });
    }
  } catch {
    // Permissão negada ou navegador sem suporte
  }

  try {
    if ("sync" in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      }).sync.register("check-collections");
    }
  } catch {
    // ignore
  }
}

export async function enableBackgroundNotifications(): Promise<boolean> {
  const subscribed = await registerBackgroundPushSchedule();
  await registerPeriodicBackgroundSync();

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: "ENABLE_BG_CHECKS" });
  }

  return subscribed;
}

export async function syncPushSchedule(): Promise<void> {
  if (Notification.permission !== "granted") return;
  await registerBackgroundPushSchedule();
  await registerPeriodicBackgroundSync();
}
