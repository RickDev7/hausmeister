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

/**
 * Agenda notificações com base em putOutDate (dia de colocar o lixo),
 * nunca em collectionDate (coleta oficial).
 */
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
    const putOutDate = event.putOutDate;

    if (settings.dayBeforeEnabled) {
      const dayBefore = format(subDays(parseISO(putOutDate), 1), "yyyy-MM-dd");
      const sendAt = combineDateAndTime(dayBefore, settings.dayBeforeTime);
      if (sendAt > now && sendAt <= horizon) {
        const kind: NotificationKind = "day_before";
        schedules.push({
          id: buildNotificationKey(event.id, kind),
          sendAt: sendAt.toISOString(),
          title: `Amanhã: ${event.typeLabel}`,
          body: `${addressName} — colocar ${event.typeLabel} na rua amanhã (coleta ${event.collectionDate}).`,
          tag: buildNotificationKey(event.id, kind),
          kind,
          collectionEventId: event.id,
        });
      }
    }

    if (settings.dayOfEnabled) {
      const sendAt = combineDateAndTime(putOutDate, settings.dayOfTime);
      if (sendAt > now && sendAt <= horizon && putOutDate >= todayStr) {
        const kind: NotificationKind = "day_of";
        schedules.push({
          id: buildNotificationKey(event.id, kind),
          sendAt: sendAt.toISOString(),
          title: `Hoje: ${event.typeLabel}`,
          body: `${addressName} — colocar ${event.typeLabel} na rua hoje (coleta ${event.collectionDate}).`,
          tag: buildNotificationKey(event.id, kind),
          kind,
          collectionEventId: event.id,
        });
      }
    }

    if (settings.eveningReminderEnabled) {
      const sendAt = combineDateAndTime(putOutDate, settings.eveningReminderTime);
      if (sendAt > now && sendAt <= horizon && putOutDate >= todayStr) {
        const kind: NotificationKind = "evening_missed";
        schedules.push({
          id: buildNotificationKey(event.id, kind),
          sendAt: sendAt.toISOString(),
          title: `Lembrete: ${event.typeLabel}`,
          body: `${addressName} — ainda sem check-in para colocar o lixo hoje.`,
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
