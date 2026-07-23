import { parseIcsFile, suggestAddressName } from "@/lib/ics-parser";
import {
  deleteAddress as deleteAddressFromDb,
  getSettings,
  replaceCollectionsForAddress,
  saveAddress,
} from "@/lib/db";
import { applyPutOutDates } from "@/lib/put-out-date";
import { generateId } from "@/lib/utils";
import type { Address, CollectionEvent, PutOutLeadDays } from "@/types";
import { DEFAULT_APP_SETTINGS, DEFAULT_PROFILE_ID } from "@/types";

async function getLeadDays(): Promise<PutOutLeadDays> {
  const settings = await getSettings();
  return settings.putOutLeadDays ?? DEFAULT_APP_SETTINGS.putOutLeadDays;
}

async function parseAndApplyPutOut(
  content: string,
  addressId: string,
  profileId: string
): Promise<CollectionEvent[]> {
  const leadDays = await getLeadDays();
  const events = parseIcsFile(content, addressId, profileId);
  return applyPutOutDates(events, leadDays);
}

export async function importNewAddress(
  file: File,
  addressName: string,
  addressId: string = generateId(),
  profileId: string = DEFAULT_PROFILE_ID
): Promise<{ address: Address; events: CollectionEvent[] }> {
  const content = await file.text();
  const events = await parseAndApplyPutOut(content, addressId, profileId);
  const now = new Date().toISOString();

  const address: Address = {
    id: addressId,
    profileId,
    name: addressName,
    createdAt: now,
    updatedAt: now,
  };

  await saveAddress(address);
  await replaceCollectionsForAddress(addressId, events);

  return { address, events };
}

export async function importFromWebcal(
  url: string,
  addressName: string,
  profileId: string = DEFAULT_PROFILE_ID
): Promise<{ address: Address; events: CollectionEvent[] }> {
  const content = await fetchWebcal(url);
  const addressId = generateId();
  const events = await parseAndApplyPutOut(content, addressId, profileId);
  const now = new Date().toISOString();

  const address: Address = {
    id: addressId,
    profileId,
    name: addressName,
    createdAt: now,
    updatedAt: now,
  };

  await saveAddress(address);
  await replaceCollectionsForAddress(addressId, events);

  return { address, events };
}

export async function reimportAddress(address: Address, file: File): Promise<CollectionEvent[]> {
  const content = await file.text();
  const events = await parseAndApplyPutOut(content, address.id, address.profileId);

  await replaceCollectionsForAddress(address.id, events);
  await saveAddress({ ...address, updatedAt: new Date().toISOString() });

  return events;
}

export async function importMultipleAddresses(
  files: File[],
  profileId: string = DEFAULT_PROFILE_ID
): Promise<{ address: Address; events: CollectionEvent[] }[]> {
  const results: { address: Address; events: CollectionEvent[] }[] = [];

  for (const file of files) {
    const name = suggestAddressName(file.name);
    results.push(await importNewAddress(file, name, generateId(), profileId));
  }

  return results;
}

export async function removeAddress(addressId: string): Promise<void> {
  await deleteAddressFromDb(addressId);
}

export function filterIcsFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".ics"));
}

export async function fetchWebcal(url: string): Promise<string> {
  const normalized = url.replace(/^webcal:\/\//i, "https://").replace(/^webcal:/i, "https:");
  const res = await fetch(normalized);
  if (!res.ok) throw new Error(`Falha ao baixar calendário: ${res.status}`);
  return res.text();
}
