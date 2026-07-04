export type WasteType =
  | "Restmüll"
  | "Biomüll"
  | "Papier"
  | "Gelbe Tonne"
  | "Sperrmüll"
  | "Grünschnitt";

export type Locale = "pt-BR" | "de" | "en";
export type ViewMode = "compact" | "detailed";

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  collectionEventId: string;
  profileId: string;
  addressName: string;
  wasteType: WasteType;
  eventDate: string;
  checkedAt: string;
  note?: string;
  photoId?: string;
}

export interface CheckInPhoto {
  id: string;
  checkInId: string;
  dataUrl: string;
  createdAt: string;
}

export const WASTE_TYPES: WasteType[] = [
  "Restmüll",
  "Biomüll",
  "Papier",
  "Gelbe Tonne",
  "Sperrmüll",
  "Grünschnitt",
];

export const DEFAULT_PROFILE_ID = "default-profile";

export type CollectionType =
  | "restmuell"
  | "biomuell"
  | "papier"
  | "gelbe_tonne"
  | "sondermuell"
  | "glas"
  | "unknown";

export interface Address {
  id: string;
  profileId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionEvent {
  id: string;
  addressId: string;
  profileId: string;
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
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  notifications: NotificationSettings;
  locale: Locale;
  viewMode: ViewMode;
  onboardingCompleted: boolean;
  activeProfileId: string;
}

export interface ShownNotification {
  id: string;
  collectionEventId: string;
  kind: "day_before" | "day_of" | "evening_missed";
  shownAt: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dayBeforeEnabled: true,
  dayBeforeTime: "18:00",
  dayOfEnabled: true,
  dayOfTime: "07:00",
  eveningReminderEnabled: true,
  eveningReminderTime: "20:00",
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "system",
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  locale: "pt-BR",
  viewMode: "detailed",
  onboardingCompleted: false,
  activeProfileId: DEFAULT_PROFILE_ID,
};

export const DEFAULT_PROFILE: Profile = {
  id: DEFAULT_PROFILE_ID,
  name: "Principal",
  createdAt: new Date(0).toISOString(),
};
