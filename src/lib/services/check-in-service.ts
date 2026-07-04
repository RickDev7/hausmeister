import type { EnrichedCollection } from "@/lib/collections";
import { resolveWasteType } from "@/lib/waste-type";
import {
  addCheckIn,
  deleteCheckIn,
  deletePhoto,
  getCheckInByEventId,
  getPhotoByCheckInId,
  savePhoto,
} from "@/lib/repositories/check-in-repository";
import { generateId } from "@/lib/utils";
import type { CheckIn, CheckInPhoto } from "@/types";

export interface CheckInOptions {
  note?: string;
  photoDataUrl?: string;
  profileId: string;
}

export async function performCheckIn(
  event: EnrichedCollection,
  options: CheckInOptions
): Promise<CheckIn> {
  const existing = await getCheckInByEventId(event.id);
  if (existing) return existing;

  const checkIn: CheckIn = {
    id: generateId(),
    collectionEventId: event.id,
    profileId: options.profileId,
    addressName: event.addressName,
    wasteType: resolveWasteType(event),
    eventDate: event.date,
    checkedAt: new Date().toISOString(),
    note: options.note?.trim() || undefined,
  };

  await addCheckIn(checkIn);

  if (options.photoDataUrl) {
    const photo: CheckInPhoto = {
      id: generateId(),
      checkInId: checkIn.id,
      dataUrl: options.photoDataUrl,
      createdAt: new Date().toISOString(),
    };
    await savePhoto(photo);
    checkIn.photoId = photo.id;
    await addCheckIn(checkIn);
  }

  return checkIn;
}

export async function revertCheckIn(collectionEventId: string): Promise<void> {
  const existing = await getCheckInByEventId(collectionEventId);
  if (!existing) return;

  const photo = await getPhotoByCheckInId(existing.id);
  if (photo) await deletePhoto(photo.id);

  await deleteCheckIn(existing.id);
}
