import { format, parseISO, subDays } from "date-fns";
import type { CollectionEvent, PutOutLeadDays } from "@/types";

export const PUT_OUT_LEAD_DAY_OPTIONS: PutOutLeadDays[] = [0, 1, 2];

/** Calcula a data de colocar o lixo na rua a partir da data oficial de coleta. */
export function computePutOutDate(
  collectionDate: string,
  leadDays: PutOutLeadDays
): string {
  if (leadDays === 0) return collectionDate;
  return format(subDays(parseISO(collectionDate), leadDays), "yyyy-MM-dd");
}

/** Aplica putOutDate a um evento, preservando a data oficial de coleta. */
export function withPutOutDate(
  event: CollectionEvent,
  leadDays: PutOutLeadDays
): CollectionEvent {
  return {
    ...event,
    putOutDate: computePutOutDate(event.collectionDate, leadDays),
  };
}

export function applyPutOutDates(
  events: CollectionEvent[],
  leadDays: PutOutLeadDays
): CollectionEvent[] {
  return events.map((event) => withPutOutDate(event, leadDays));
}

/**
 * Normaliza eventos legados que ainda usam `date` (pré-v4).
 * A data oficial do ICS fica em collectionDate; putOutDate é recalculado.
 */
export function normalizeCollectionEvent(
  raw: CollectionEvent & { date?: string },
  leadDays: PutOutLeadDays
): CollectionEvent {
  const collectionDate = raw.collectionDate || raw.date;
  if (!collectionDate) {
    throw new Error("Evento sem data de coleta");
  }

  const { date: _legacyDate, ...rest } = raw;
  void _legacyDate;

  return withPutOutDate(
    {
      ...rest,
      collectionDate,
      putOutDate: raw.putOutDate || collectionDate,
    },
    leadDays
  );
}

export function normalizeCollectionEvents(
  events: Array<CollectionEvent & { date?: string }>,
  leadDays: PutOutLeadDays
): CollectionEvent[] {
  return events.map((event) => normalizeCollectionEvent(event, leadDays));
}
