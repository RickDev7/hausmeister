import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CheckIn, WasteType } from "@/types";

export function formatCheckInDate(iso: string): string {
  return format(parseISO(iso.slice(0, 10)), "dd/MM/yyyy", { locale: ptBR });
}

export function formatCheckInTime(iso: string): string {
  const date = new Date(iso);
  return format(date, "HH:mm", { locale: ptBR });
}

export function getCheckInDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function groupCheckInsByDate(checkIns: CheckIn[]): Map<string, CheckIn[]> {
  const map = new Map<string, CheckIn[]>();

  for (const checkIn of checkIns) {
    const key = getCheckInDateKey(checkIn.checkedAt);
    const group = map.get(key) ?? [];
    group.push(checkIn);
    map.set(key, group);
  }

  for (const [, group] of map) {
    group.sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  }

  return new Map(
    [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
  );
}

export interface CheckInFilters {
  wasteType?: WasteType;
  addressName?: string;
}

export function filterCheckIns(checkIns: CheckIn[], filters: CheckInFilters): CheckIn[] {
  return checkIns.filter((checkIn) => {
    if (filters.wasteType && checkIn.wasteType !== filters.wasteType) return false;
    if (filters.addressName && checkIn.addressName !== filters.addressName) return false;
    return true;
  });
}

export function getUniqueAddressNames(checkIns: CheckIn[]): string[] {
  return [...new Set(checkIns.map((c) => c.addressName))].sort((a, b) =>
    a.localeCompare(b)
  );
}
