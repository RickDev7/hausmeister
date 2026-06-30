import { addDays, format, subDays } from "date-fns";
import {
  getAllCollections,
  getSettings,
  getShownNotifications,
  markNotificationShown,
  cleanupOldNotifications,
} from "@/lib/db";
import { generateId } from "@/lib/utils";
import type { CollectionEvent, NotificationSettings } from "@/types";

export function isNotificationTimeReached(targetTime: string, now = new Date()): boolean {
  const [h, m] = targetTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h ?? 0, m ?? 0, 0, 0);
  return now >= target;
}

function isTimeReached(targetTime: string): boolean {
  return isNotificationTimeReached(targetTime);
}

function buildNotificationKey(
  eventId: string,
  kind: "day_before" | "day_of"
): string {
  return `${eventId}_${kind}`;
}

async function showNotification(
  title: string,
  body: string,
  tag: string
): Promise<void> {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body,
    tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        await registration.showNotification(title, options);
        return;
      }
    }
  } catch (error) {
    console.warn("Falha ao enviar via Service Worker, usando fallback:", error);
  }

  new Notification(title, options);
}

export async function sendTestNotification(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  await showNotification(
    "Teste: Planejador de Lixo",
    "As notificações estão funcionando corretamente!",
    "test-notification"
  );
  return true;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

export async function checkAndShowNotifications(
  addressMap: Map<string, string>
): Promise<void> {
  const settings = await getSettings();
  if (!settings.notifications.enabled) return;
  if (Notification.permission !== "granted") return;

  const events = await getAllCollections();
  const shown = await getShownNotifications();
  const shownSet = new Set(shown.map((s) => `${s.collectionEventId}_${s.kind}`));

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  await cleanupOldNotifications(format(subDays(new Date(), 30), "yyyy-MM-dd"));

  for (const event of events) {
    await processEventNotification(event, addressMap, settings.notifications, {
      today,
      tomorrow,
      shownSet,
    });
  }
}

async function processEventNotification(
  event: CollectionEvent,
  addressMap: Map<string, string>,
  settings: NotificationSettings,
  ctx: {
    today: string;
    tomorrow: string;
    shownSet: Set<string>;
  }
): Promise<void> {
  const addressName = addressMap.get(event.addressId) ?? "Desconhecido";

  if (settings.dayBeforeEnabled && event.date === ctx.tomorrow) {
    const key = buildNotificationKey(event.id, "day_before");
    if (!ctx.shownSet.has(key) && isTimeReached(settings.dayBeforeTime)) {
      await showNotification(
        `Amanhã: ${event.typeLabel}`,
        `${addressName} — ${event.typeLabel} será coletado amanhã.`,
        key
      );
      await markNotificationShown({
        id: generateId(),
        collectionEventId: event.id,
        kind: "day_before",
        shownAt: ctx.today,
      });
      ctx.shownSet.add(key);
    }
  }

  if (settings.dayOfEnabled && event.date === ctx.today) {
    const key = buildNotificationKey(event.id, "day_of");
    if (!ctx.shownSet.has(key) && isTimeReached(settings.dayOfTime)) {
      await showNotification(
        `Hoje: ${event.typeLabel}`,
        `${addressName} — ${event.typeLabel} será coletado hoje.`,
        key
      );
      await markNotificationShown({
        id: generateId(),
        collectionEventId: event.id,
        kind: "day_of",
        shownAt: ctx.today,
      });
      ctx.shownSet.add(key);
    }
  }
}

export function startNotificationScheduler(
  addressMap: Map<string, string>
): () => void {
  const run = () => checkAndShowNotifications(addressMap);
  run();
  const interval = setInterval(run, 5 * 60 * 1000);
  return () => clearInterval(interval);
}
