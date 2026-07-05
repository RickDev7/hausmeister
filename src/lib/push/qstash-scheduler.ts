import { Client } from "@upstash/qstash";
import type { ScheduledPushNotification } from "@/lib/notification-schedule";

export function isQStashConfigured(): boolean {
  return !!process.env.QSTASH_TOKEN;
}

export function getPushBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function scheduleNotificationsViaQStash(
  deviceId: string,
  schedules: ScheduledPushNotification[]
): Promise<number> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return 0;

  const client = new Client({ token });
  const baseUrl = getPushBaseUrl();
  const now = Date.now();
  let scheduled = 0;

  for (const notification of schedules) {
    const sendAtMs = new Date(notification.sendAt).getTime();
    if (sendAtMs <= now) continue;

    await client.publishJSON({
      url: `${baseUrl}/api/push/send`,
      body: {
        deviceId,
        notificationId: notification.id,
      },
      notBefore: Math.floor(sendAtMs / 1000),
      deduplicationId: `${deviceId}:${notification.id}`,
      retries: 3,
    });
    scheduled++;
  }

  return scheduled;
}
