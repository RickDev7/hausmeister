import type { CollectionEvent, WasteType } from "@/types";

export function resolveWasteType(event: CollectionEvent): WasteType {
  const title = event.originalTitle;

  if (/grünschnitt|gruenschnitt|schnittgut/i.test(title)) {
    return "Grünschnitt";
  }

  if (/sperrm[uü]ll/i.test(title)) {
    return "Sperrmüll";
  }

  const mapping: Record<CollectionEvent["type"], WasteType> = {
    restmuell: "Restmüll",
    biomuell: "Biomüll",
    papier: "Papier",
    gelbe_tonne: "Gelbe Tonne",
    sondermuell: "Sperrmüll",
    glas: "Restmüll",
    unknown: "Restmüll",
  };

  return mapping[event.type];
}
