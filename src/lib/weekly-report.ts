import { endOfWeek, format, startOfWeek } from "date-fns";
import { isMissedCheckIn } from "@/lib/services/check-in-service";
import type { CheckIn, CollectionEvent } from "@/types";

export type WeeklyReportStatus = "done" | "pending" | "missed";

export interface WeeklyReportRow {
  eventId: string;
  date: string;
  addressName: string;
  typeLabel: string;
  status: WeeklyReportStatus;
  checkedAt?: string;
  note?: string;
}

export interface WeeklyAddressSummary {
  addressName: string;
  scheduled: number;
  checkIns: number;
  missed: number;
  pending: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  scheduled: number;
  checkIns: number;
  missed: number;
  pending: number;
  complianceRate: number;
  byAddress: WeeklyAddressSummary[];
  rows: WeeklyReportRow[];
}

export function getWeekBounds(referenceDate: Date = new Date()): { start: string; end: string } {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

function resolveRowStatus(checkIn?: CheckIn): WeeklyReportStatus {
  if (!checkIn) return "pending";
  if (isMissedCheckIn(checkIn)) return "missed";
  return "done";
}

export function computeWeeklyReport(
  collections: CollectionEvent[],
  checkIns: CheckIn[],
  addressMap: Map<string, string>,
  referenceDate: Date = new Date()
): WeeklyReport {
  const { start, end } = getWeekBounds(referenceDate);
  const checkedByEventId = new Map(checkIns.map((c) => [c.collectionEventId, c]));

  const weekEvents = collections
    .filter((e) => e.date >= start && e.date <= end)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (addressMap.get(a.addressId) ?? "").localeCompare(addressMap.get(b.addressId) ?? "")
    );

  const rows: WeeklyReportRow[] = weekEvents.map((event) => {
    const checkIn = checkedByEventId.get(event.id);
    const status = resolveRowStatus(checkIn);
    return {
      eventId: event.id,
      date: event.date,
      addressName: addressMap.get(event.addressId) ?? "Desconhecido",
      typeLabel: event.typeLabel,
      status,
      checkedAt: checkIn?.checkedAt,
      note: status === "missed" ? checkIn?.note : undefined,
    };
  });

  const addressStats = new Map<string, WeeklyAddressSummary>();

  for (const row of rows) {
    const current = addressStats.get(row.addressName) ?? {
      addressName: row.addressName,
      scheduled: 0,
      checkIns: 0,
      missed: 0,
      pending: 0,
    };
    current.scheduled++;
    if (row.status === "done") current.checkIns++;
    else if (row.status === "missed") current.missed++;
    else current.pending++;
    addressStats.set(row.addressName, current);
  }

  const checkInsCount = rows.filter((r) => r.status === "done").length;
  const missedCount = rows.filter((r) => r.status === "missed").length;
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const complianceRate =
    rows.length > 0 ? Math.round((checkInsCount / rows.length) * 100) : 100;

  return {
    weekStart: start,
    weekEnd: end,
    scheduled: rows.length,
    checkIns: checkInsCount,
    missed: missedCount,
    pending: pendingCount,
    complianceRate,
    byAddress: [...addressStats.values()].sort((a, b) =>
      a.addressName.localeCompare(b.addressName)
    ),
    rows,
  };
}

export function shiftWeek(referenceDate: Date, weeks: number): Date {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}
