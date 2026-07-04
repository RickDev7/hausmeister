import { addDays, format, parseISO, subDays } from "date-fns";
import type { CollectionEvent, NotificationSettings } from "@/types";

export type NotificationKind = "day_before" | "day_of" | "evening_missed";

export interface ScheduledPushNotification {
  id: string;
  sendAt: string;
  title: string;
  body: string;
  tag: string;
  kind: NotificationKind;
  collectionEventId: string;
}

function buildNotificationKey(eventId: string, kind: NotificationKind): string {
  return `${eventId}_${kind}`;
}

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = parseISO(dateStr);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export function buildPushSchedule(
  events: CollectionEvent[],
  addressMap: Map<string, string>,
  settings: NotificationSettings,
  now = new Date(),
  horizonDays = 60
): ScheduledPushNotification[] {
  if (!settings.enabled) return [];

  const horizon = addDays(now, horizonDays);
  const schedules: ScheduledPushNotification[] = [];
  const todayStr = format(now, "yyyy-MM-dd");

  for (const event of events) {
    const addressName = addressMap.get(event.addressId) ?? "Desconhecido";

    if (settings.dayBeforeEnabled) {
      const dayBefore = format(subDays(parseISO(event.date), 1), "yyyy-MM-dd");
      const sendAt = combineDateAndTime(dayBefore, settings.dayBeforeTime);
      if (sendAt > now && sendAt <= horizon) {
        const kind: NotificationKind = "day_before";
        schedules.push({
          id: buildNotificationKey(event.id, kind),
          sendAt: sendAt.toISOString(),
          title: `Amanhã: ${event.typeLabel}`,
          body: `${addressName} — ${event.typeLabel} será coletado amanhã.`,
          tag: buildNotificationKey(event.id, kind),
          kind,
          collectionEventId: event.id,
        });
      }
    }

    if (settings.dayOfEnabled) {
      const sendAt = combineDateAndTime(event.date, settings.dayOfTime);
      if (sendAt > now && sendAt <= horizon && event.date >= todayStr) {
        const kind: NotificationKind = "day_of";
        schedules.push({
          id: buildNotificationKey(event.id, kind),
          sendAt: sendAt.toISOString(),
          title: `Hoje: ${event.typeLabel}`,
          body: `${addressName} — ${event.typeLabel} será coletado hoje.`,
          tag: buildNotificationKey(event.id, kind),
          kind,
          collectionEventId: event.id,
        });
      }
    }

    if (settings.eveningReminderEnabled) {
      const sendAt = combineDateAndTime(event.date, settings.eveningReminderTime);
      if (sendAt > now && sendAt <= horizon && event.date >= todayStr) {
        const kind: NotificationKind = "evening_missed";
        schedules.push({
          id: buildNotificationKey(event.id, kind),
          sendAt: sendAt.toISOString(),
          title: `Lembrete: ${event.typeLabel}`,
          body: `${addressName} — ainda sem check-in para a coleta de hoje.`,
          tag: buildNotificationKey(event.id, kind),
          kind,
          collectionEventId: event.id,
        });
      }
    }
  }

  return schedules.sort((a, b) => a.sendAt.localeCompare(b.sendAt));
}

export function isNotificationTimeReached(targetTime: string, now = new Date()): boolean {
  const [h, m] = targetTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h ?? 0, m ?? 0, 0, 0);
  return now >= target;
}

export { buildNotificationKey };
