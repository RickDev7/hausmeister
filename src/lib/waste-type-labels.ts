import type { Messages } from "@/i18n/messages/pt-BR";
import type { CollectionType, WasteType } from "@/types";

export function getWasteTypeLabel(wasteType: WasteType, messages: Messages): string {
  return messages.wasteTypes[wasteType];
}

export function getCollectionTypeLabel(type: CollectionType, messages: Messages): string {
  return messages.collectionTypes[type];
}
