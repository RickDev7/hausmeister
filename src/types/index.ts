export type WasteType =
  | "Restmüll"
  | "Biomüll"
  | "Papier"
  | "Gelbe Tonne"
  | "Sperrmüll"
  | "Grünschnitt";

export interface CheckIn {
  id: string;
  collectionEventId: string;
  addressName: string;
  wasteType: WasteType;
  eventDate: string;
  checkedAt: string;
}

export const WASTE_TYPES: WasteType[] = [
  "Restmüll",
  "Biomüll",
  "Papier",
  "Gelbe Tonne",
  "Sperrmüll",
  "Grünschnitt",
];

export type CollectionType =
  | "restmuell"
  | "biomuell"
  | "papier"
  | "gelbe_tonne"
  | "sondermuell"
  | "unknown";

export interface Address {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionEvent {
  id: string;
  addressId: string;
  type: CollectionType;
  typeLabel: string;
  originalTitle: string;
  date: string;
  datetime?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  dayBeforeEnabled: boolean;
  dayBeforeTime: string;
  dayOfEnabled: boolean;
  dayOfTime: string;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  notifications: NotificationSettings;
}

export interface ShownNotification {
  id: string;
  collectionEventId: string;
  kind: "day_before" | "day_of";
  shownAt: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dayBeforeEnabled: true,
  dayBeforeTime: "18:00",
  dayOfEnabled: true,
  dayOfTime: "07:00",
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "system",
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
};
