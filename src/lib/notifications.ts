import { addDays, format, subDays } from "date-fns";
import {
  getAllCollections,
  getSettings,
  getShownNotifications,
  markNotificationShown,
  cleanupOldNotifications,
  getCheckInByEventId,
} from "@/lib/db";
import { generateId } from "@/lib/utils";
import type { CollectionEvent, NotificationSettings } from "@/types";
import {
  buildNotificationKey,
  isNotificationTimeReached,
  type NotificationKind,
} from "@/lib/notification-schedule";
export {
  enableBackgroundNotifications,
  syncPushSchedule,
  unregisterBackgroundPush,
} from "@/lib/push/client";

export { isNotificationTimeReached };

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
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
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

export async function setupBackgroundNotifications(): Promise<{
  permission: NotificationPermission;
  pushRegistered: boolean;
}> {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    return { permission, pushRegistered: false };
  }

  const { enableBackgroundNotifications } = await import("@/lib/push/client");
  const pushRegistered = await enableBackgroundNotifications();
  return { permission, pushRegistered };
}

export async function teardownBackgroundNotifications(): Promise<void> {
  const { unregisterBackgroundPush } = await import("@/lib/push/client");
  await unregisterBackgroundPush();
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
  const putOutDate = event.putOutDate;

  if (settings.dayBeforeEnabled && putOutDate === ctx.tomorrow) {
    const kind: NotificationKind = "day_before";
    const key = buildNotificationKey(event.id, kind);
    if (!ctx.shownSet.has(key) && isNotificationTimeReached(settings.dayBeforeTime)) {
      await showNotification(
        `Amanhã: ${event.typeLabel}`,
        `${addressName} — colocar ${event.typeLabel} na rua amanhã (coleta ${event.collectionDate}).`,
        key
      );
      await markNotificationShown({
        id: generateId(),
        collectionEventId: event.id,
        kind,
        shownAt: ctx.today,
      });
      ctx.shownSet.add(key);
    }
  }

  if (settings.dayOfEnabled && putOutDate === ctx.today) {
    const kind: NotificationKind = "day_of";
    const key = buildNotificationKey(event.id, kind);
    if (!ctx.shownSet.has(key) && isNotificationTimeReached(settings.dayOfTime)) {
      await showNotification(
        `Hoje: ${event.typeLabel}`,
        `${addressName} — colocar ${event.typeLabel} na rua hoje (coleta ${event.collectionDate}).`,
        key
      );
      await markNotificationShown({
        id: generateId(),
        collectionEventId: event.id,
        kind,
        shownAt: ctx.today,
      });
      ctx.shownSet.add(key);
    }

    if (settings.eveningReminderEnabled) {
      const eveningKind: NotificationKind = "evening_missed";
      const eveningKey = buildNotificationKey(event.id, eveningKind);
      if (!ctx.shownSet.has(eveningKey) && isNotificationTimeReached(settings.eveningReminderTime)) {
        const checkIn = await getCheckInByEventId(event.id);
        if (!checkIn) {
          await showNotification(
            `Lembrete: ${event.typeLabel}`,
            `${addressName} — ainda sem check-in para colocar o lixo hoje.`,
            eveningKey
          );
          await markNotificationShown({
            id: generateId(),
            collectionEventId: event.id,
            kind: eveningKind,
            shownAt: ctx.today,
          });
          ctx.shownSet.add(eveningKey);
        }
      }
    }
  }
}

export function startNotificationScheduler(
  addressMap: Map<string, string>
): () => void {
  const run = async () => {
    await checkAndShowNotifications(addressMap);
    const { syncPushSchedule } = await import("@/lib/push/client");
    await syncPushSchedule();
  };
  run();
  const interval = setInterval(run, 5 * 60 * 1000);
  return () => clearInterval(interval);
}

export async function syncNotificationsToServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: "RUN_BG_CHECK" });
}
