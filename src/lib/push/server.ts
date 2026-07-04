import webpush from "web-push";
import type { ScheduledPushNotification } from "@/lib/notification-schedule";
import {
  getDueNotifications as getDueFile,
  markNotificationsSent as markSentFile,
  removeSubscription as removeSubFile,
  savePushRegistration as saveFile,
} from "@/lib/push/file-store";
import {
  getDueNotificationsRedis,
  isRedisConfigured,
  markNotificationsSentRedis,
  removeSubscriptionRedis,
  savePushRegistrationRedis,
} from "@/lib/push/redis-store";

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

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@example.com";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function registerPushSchedule(
  deviceId: string,
  subscription: PushSubscriptionJSON,
  schedules: ScheduledPushNotification[]
): Promise<void> {
  if (isRedisConfigured()) {
    await savePushRegistrationRedis(deviceId, subscription, schedules);
    return;
  }
  await saveFile(deviceId, subscription, schedules);
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
      if (!item.subscription.endpoint) continue;

      await webpush.sendNotification(
        item.subscription as webpush.PushSubscription,
        JSON.stringify({
          title: item.notification.title,
          body: item.notification.body,
          tag: item.notification.tag,
          kind: item.notification.kind,
          collectionEventId: item.notification.collectionEventId,
        })
      );
      sent++;
      const list = sentByDevice.get(item.deviceId) ?? [];
      list.push(item.notification.id);
      sentByDevice.set(item.deviceId, list);
    } catch (error) {
      failed++;
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        if (isRedisConfigured()) {
          await removeSubscriptionRedis(item.deviceId);
        } else {
          await removeSubFile(item.deviceId);
        }
        removed++;
      }
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
