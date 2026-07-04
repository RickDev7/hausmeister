import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ScheduledPushNotification } from "@/lib/notification-schedule";

export interface PushSubscriptionRecord {
  deviceId: string;
  subscription: PushSubscriptionJSON;
  updatedAt: string;
}

interface FilePushStore {
  subscriptions: Record<string, PushSubscriptionRecord>;
  schedules: Record<string, ScheduledPushNotification[]>;
}

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(STORE_DIR, "push-store.json");

async function readStore(): Promise<FilePushStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as FilePushStore;
  } catch {
    return { subscriptions: {}, schedules: {} };
  }
}

async function writeStore(store: FilePushStore): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function savePushRegistration(
  deviceId: string,
  subscription: PushSubscriptionJSON,
  schedules: ScheduledPushNotification[]
): Promise<void> {
  const store = await readStore();
  store.subscriptions[deviceId] = {
    deviceId,
    subscription,
    updatedAt: new Date().toISOString(),
  };
  store.schedules[deviceId] = schedules;
  await writeStore(store);
}

export async function removePushRegistration(deviceId: string): Promise<void> {
  const store = await readStore();
  delete store.subscriptions[deviceId];
  delete store.schedules[deviceId];
  await writeStore(store);
}

export async function getDueNotifications(now = new Date()): Promise<
  Array<{
    deviceId: string;
    subscription: PushSubscriptionJSON;
    notification: ScheduledPushNotification;
  }>
> {
  const store = await readStore();
  const due: Array<{
    deviceId: string;
    subscription: PushSubscriptionJSON;
    notification: ScheduledPushNotification;
  }> = [];

  for (const [deviceId, schedules] of Object.entries(store.schedules)) {
    const sub = store.subscriptions[deviceId];
    if (!sub) continue;

    for (const notification of schedules) {
      if (new Date(notification.sendAt) <= now) {
        due.push({
          deviceId,
          subscription: sub.subscription,
          notification,
        });
      }
    }
  }

  return due;
}

export async function markNotificationsSent(
  deviceId: string,
  notificationIds: string[]
): Promise<void> {
  const store = await readStore();
  const ids = new Set(notificationIds);
  store.schedules[deviceId] = (store.schedules[deviceId] ?? []).filter((n) => !ids.has(n.id));
  await writeStore(store);
}

export async function removeSubscription(deviceId: string): Promise<void> {
  await removePushRegistration(deviceId);
}
