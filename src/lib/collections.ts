import {
  addDays,
  format,
} from "date-fns";
import type { CollectionEvent, CollectionType } from "@/types";

export interface CollectionFilters {
  addressId?: string;
  type?: CollectionType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface GroupedCollections {
  today: EnrichedCollection[];
  tomorrow: EnrichedCollection[];
  upcoming: EnrichedCollection[];
}

export interface EnrichedCollection extends CollectionEvent {
  addressName: string;
}

export function filterCollections(
  events: EnrichedCollection[],
  filters: CollectionFilters
): EnrichedCollection[] {
  return events.filter((event) => {
    if (filters.addressId && event.addressId !== filters.addressId) return false;
    if (filters.type && event.type !== filters.type) return false;
    if (filters.dateFrom && event.date < filters.dateFrom) return false;
    if (filters.dateTo && event.date > filters.dateTo) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!event.addressName.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export function enrichCollections(
  events: CollectionEvent[],
  addressMap: Map<string, string>
): EnrichedCollection[] {
  return events.map((event) => ({
    ...event,
    addressName: addressMap.get(event.addressId) ?? "Desconhecido",
  }));
}

export function groupCollections(events: EnrichedCollection[]): GroupedCollections {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd");

  const future = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.addressName.localeCompare(b.addressName));

  return {
    today: future.filter((e) => e.date === todayStr),
    tomorrow: future.filter((e) => e.date === tomorrowStr),
    upcoming: future.filter((e) => e.date > tomorrowStr),
  };
}

export function hasActiveCollectionFilters(filters: CollectionFilters): boolean {
  return Boolean(
    filters.addressId || filters.type || filters.dateFrom || filters.dateTo
  );
}

export function groupByDate(
  events: EnrichedCollection[]
): Map<string, EnrichedCollection[]> {
  const map = new Map<string, EnrichedCollection[]>();
  for (const event of events) {
    const existing = map.get(event.date) ?? [];
    existing.push(event);
    map.set(event.date, existing);
  }
  return map;
}
