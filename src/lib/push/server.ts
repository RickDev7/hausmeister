import webpush from "web-push";
import type { ScheduledPushNotification } from "@/lib/notification-schedule";
import {
  getDueNotifications as getDueFile,
  getPushNotificationById as getPushNotificationByIdFile,
  markNotificationsSent as markSentFile,
  removeSubscription as removeSubFile,
  savePushRegistration as saveFile,
} from "@/lib/push/file-store";
import {
  getDueNotificationsRedis,
  getPushNotificationById as getPushNotificationByIdRedis,
  isRedisConfigured,
  markNotificationsSentRedis,
  removeSubscriptionRedis,
  savePushRegistrationRedis,
} from "@/lib/push/redis-store";
import { isQStashConfigured, scheduleNotificationsViaQStash } from "@/lib/push/qstash-scheduler";

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export function isPushServerConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

export function getPushServerStatus(): {
  vapid: boolean;
  redis: boolean;
  qstash: boolean;
} {
  return {
    vapid: isPushServerConfigured(),
    redis: isRedisConfigured(),
    qstash: isQStashConfigured(),
  };
}

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@example.com";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function deliverPush(
  deviceId: string,
  subscription: PushSubscriptionJSON,
  notification: ScheduledPushNotification
): Promise<"sent" | "failed" | "removed"> {
  if (!subscription.endpoint) return "failed";

  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify({
        title: notification.title,
        body: notification.body,
        tag: notification.tag,
        kind: notification.kind,
        collectionEventId: notification.collectionEventId,
      })
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      if (isRedisConfigured()) {
        await removeSubscriptionRedis(deviceId);
      } else {
        await removeSubFile(deviceId);
      }
      return "removed";
    }
    throw error;
  }
}

export async function registerPushSchedule(
  deviceId: string,
  subscription: PushSubscriptionJSON,
  schedules: ScheduledPushNotification[]
): Promise<{ storage: "redis" | "file"; qstashScheduled: number }> {
  if (isRedisConfigured()) {
    await savePushRegistrationRedis(deviceId, subscription, schedules);
    const qstashScheduled = isQStashConfigured()
      ? await scheduleNotificationsViaQStash(deviceId, schedules)
      : 0;
    return { storage: "redis", qstashScheduled };
  }

  await saveFile(deviceId, subscription, schedules);
  return { storage: "file", qstashScheduled: 0 };
}

export async function sendSinglePushNotification(
  deviceId: string,
  notificationId: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!configureWebPush()) {
    return { ok: false, error: "Web Push não configurado" };
  }

  const record = isRedisConfigured()
    ? await getPushNotificationByIdRedis(deviceId, notificationId)
    : await getPushNotificationByIdFile(deviceId, notificationId);

  if (!record) {
    return { ok: true, skipped: true };
  }

  const result = await deliverPush(deviceId, record.subscription, record.notification);

  if (result === "sent") {
    if (isRedisConfigured()) {
      await markNotificationsSentRedis(deviceId, [notificationId]);
    } else {
      await markSentFile(deviceId, [notificationId]);
    }
    return { ok: true };
  }

  if (result === "removed") {
    return { ok: false, error: "Subscription expirada" };
  }

  return { ok: false, error: "Falha ao enviar" };
}

export async function processDuePushNotifications(): Promise<{
  sent: number;
  failed: number;
  removed: number;
}> {
  if (!configureWebPush()) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  const now = new Date();
  const due = isRedisConfigured()
    ? await getDueNotificationsRedis(now)
    : await getDueFile(now);

  let sent = 0;
  let failed = 0;
  let removed = 0;

  const sentByDevice = new Map<string, string[]>();

  for (const item of due) {
    try {
      const result = await deliverPush(item.deviceId, item.subscription, item.notification);
      if (result === "sent") {
        sent++;
        const list = sentByDevice.get(item.deviceId) ?? [];
        list.push(item.notification.id);
        sentByDevice.set(item.deviceId, list);
      } else if (result === "removed") {
        removed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  for (const [deviceId, ids] of sentByDevice) {
    if (isRedisConfigured()) {
      await markNotificationsSentRedis(deviceId, ids);
    } else {
      await markSentFile(deviceId, ids);
    }
  }

  return { sent, failed, removed };
}
