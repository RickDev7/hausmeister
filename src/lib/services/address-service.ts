import { parseIcsFile, suggestAddressName } from "@/lib/ics-parser";
import {
  deleteAddress as deleteAddressFromDb,
  replaceCollectionsForAddress,
  saveAddress,
} from "@/lib/db";
import { generateId } from "@/lib/utils";
import type { Address, CollectionEvent } from "@/types";

export async function importNewAddress(
  file: File,
  addressName: string,
  addressId: string = generateId()
): Promise<{ address: Address; events: CollectionEvent[] }> {
  const content = await file.text();
  const events = parseIcsFile(content, addressId);
  const now = new Date().toISOString();

  const address: Address = {
    id: addressId,
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
  const events = parseIcsFile(content, address.id);

  await replaceCollectionsForAddress(address.id, events);
  await saveAddress({ ...address, updatedAt: new Date().toISOString() });

  return events;
}

export async function importMultipleAddresses(
  files: File[]
): Promise<{ address: Address; events: CollectionEvent[] }[]> {
  const results: { address: Address; events: CollectionEvent[] }[] = [];

  for (const file of files) {
    const name = suggestAddressName(file.name);
    results.push(await importNewAddress(file, name));
  }

  return results;
}

export async function removeAddress(addressId: string): Promise<void> {
  await deleteAddressFromDb(addressId);
}

export function filterIcsFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".ics"));
}
