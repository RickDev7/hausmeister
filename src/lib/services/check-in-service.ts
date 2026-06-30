import type { EnrichedCollection } from "@/lib/collections";
import { resolveWasteType } from "@/lib/waste-type";
import {
  addCheckIn,
  deleteCheckIn,
  getCheckInByEventId,
} from "@/lib/repositories/check-in-repository";
import { generateId } from "@/lib/utils";
import type { CheckIn } from "@/types";

export async function performCheckIn(event: EnrichedCollection): Promise<CheckIn> {
  const existing = await getCheckInByEventId(event.id);
  if (existing) return existing;

  const checkIn: CheckIn = {
    id: generateId(),
    collectionEventId: event.id,
    addressName: event.addressName,
    wasteType: resolveWasteType(event),
    eventDate: event.date,
    checkedAt: new Date().toISOString(),
  };

  await addCheckIn(checkIn);
  return checkIn;
}

export async function revertCheckIn(collectionEventId: string): Promise<void> {
  const existing = await getCheckInByEventId(collectionEventId);
  if (!existing) return;
  await deleteCheckIn(existing.id);
}
