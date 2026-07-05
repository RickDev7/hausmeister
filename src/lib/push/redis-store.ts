import { Redis } from "@upstash/redis";
import type { ScheduledPushNotification } from "@/lib/notification-schedule";
import type { PushSubscriptionRecord } from "@/lib/push/file-store";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const SUB_PREFIX = "push:sub:";
const SCHEDULE_PREFIX = "push:sched:";
const DUE_KEY = "push:due";

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function savePushRegistrationRedis(
  deviceId: string,
  subscription: PushSubscriptionJSON,
  schedules: ScheduledPushNotification[]
): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis não configurado");

  const record: PushSubscriptionRecord = {
    deviceId,
    subscription,
    updatedAt: new Date().toISOString(),
  };

  const oldSchedules = (await redis.get<ScheduledPushNotification[]>(`${SCHEDULE_PREFIX}${deviceId}`)) ?? [];
  for (const s of oldSchedules) {
    await redis.zrem(DUE_KEY, `${deviceId}:${s.id}`);
  }

  await redis.set(`${SUB_PREFIX}${deviceId}`, record);
  await redis.set(`${SCHEDULE_PREFIX}${deviceId}`, schedules);

  for (const schedule of schedules) {
    await redis.zadd(DUE_KEY, {
      score: new Date(schedule.sendAt).getTime(),
      member: `${deviceId}:${schedule.id}`,
    });
  }
}

export async function getDueNotificationsRedis(now = new Date()): Promise<
  Array<{
    deviceId: string;
    subscription: PushSubscriptionJSON;
    notification: ScheduledPushNotification;
  }>
> {
  const redis = getRedis();
  if (!redis) return [];

  const members = await redis.zrange(DUE_KEY, 0, now.getTime(), { byScore: true });
  const due: Array<{
    deviceId: string;
    subscription: PushSubscriptionJSON;
    notification: ScheduledPushNotification;
  }> = [];

  for (const member of members) {
    const [deviceId, ...rest] = String(member).split(":");
    const notificationId = rest.join(":");
    if (!deviceId || !notificationId) continue;

    const subRecord = await redis.get<PushSubscriptionRecord>(`${SUB_PREFIX}${deviceId}`);
    const schedules = await redis.get<ScheduledPushNotification[]>(`${SCHEDULE_PREFIX}${deviceId}`);
    const notification = schedules?.find((s) => s.id === notificationId);
    if (!subRecord || !notification) {
      await redis.zrem(DUE_KEY, member);
      continue;
    }

    due.push({
      deviceId,
      subscription: subRecord.subscription,
      notification,
    });
  }

  return due;
}

export async function markNotificationsSentRedis(
  deviceId: string,
  notificationIds: string[]
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const schedules = (await redis.get<ScheduledPushNotification[]>(`${SCHEDULE_PREFIX}${deviceId}`)) ?? [];
  const ids = new Set(notificationIds);
  const remaining = schedules.filter((s) => !ids.has(s.id));

  await redis.set(`${SCHEDULE_PREFIX}${deviceId}`, remaining);

  for (const id of notificationIds) {
    await redis.zrem(DUE_KEY, `${deviceId}:${id}`);
  }
}

export async function getPushNotificationById(
  deviceId: string,
  notificationId: string
): Promise<{
  subscription: PushSubscriptionJSON;
  notification: ScheduledPushNotification;
} | null> {
  const redis = getRedis();
  if (!redis) return null;

  const subRecord = await redis.get<PushSubscriptionRecord>(`${SUB_PREFIX}${deviceId}`);
  const schedules = await redis.get<ScheduledPushNotification[]>(`${SCHEDULE_PREFIX}${deviceId}`);
  const notification = schedules?.find((s) => s.id === notificationId);

  if (!subRecord || !notification) return null;

  return {
    subscription: subRecord.subscription,
    notification,
  };
}

export async function removeSubscriptionRedis(deviceId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const schedules = (await redis.get<ScheduledPushNotification[]>(`${SCHEDULE_PREFIX}${deviceId}`)) ?? [];
  for (const s of schedules) {
    await redis.zrem(DUE_KEY, `${deviceId}:${s.id}`);
  }

  await redis.del(`${SUB_PREFIX}${deviceId}`, `${SCHEDULE_PREFIX}${deviceId}`);
}
