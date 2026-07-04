import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import type { CheckIn, CollectionEvent, WasteType } from "@/types";
import { isCompletedCheckIn } from "@/lib/services/check-in-service";

export interface CollectionStats {
  totalCheckIns: number;
  thisMonth: number;
  currentStreak: number;
  byType: Record<WasteType, number>;
}

export function computeCheckInStats(checkIns: CheckIn[]): CollectionStats {
  const completed = checkIns.filter(isCompletedCheckIn);
  const now = new Date();
  const monthPrefix = format(now, "yyyy-MM");

  const byType = {} as Record<WasteType, number>;
  let thisMonth = 0;

  for (const c of completed) {
    if (c.checkedAt.startsWith(monthPrefix)) thisMonth++;
    byType[c.wasteType] = (byType[c.wasteType] ?? 0) + 1;
  }

  const streak = computeStreak(completed);

  return {
    totalCheckIns: completed.length,
    thisMonth,
    currentStreak: streak,
    byType,
  };
}

function computeStreak(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;

  const days = new Set(checkIns.map((c) => c.checkedAt.slice(0, 10)));
  let streak = 0;
  const d = new Date();

  while (true) {
    const key = format(d, "yyyy-MM-dd");
    if (days.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getEventsForMonth(
  events: CollectionEvent[],
  month: Date
): Map<string, CollectionEvent[]> {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const map = new Map<string, CollectionEvent[]>();

  for (const event of events) {
    const d = parseISO(event.date);
    if (d >= start && d <= end) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
  }
  return map;
}

export function getCalendarDays(month: Date): Date[] {
  return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
}

export function isCurrentMonth(day: Date, month: Date): boolean {
  return isSameMonth(day, month);
}
