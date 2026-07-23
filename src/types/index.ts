export type WasteType =
  | "Restmüll"
  | "Biomüll"
  | "Papier"
  | "Gelbe Tonne"
  | "Sperrmüll"
  | "Grünschnitt";

export type Locale = "pt-BR" | "de" | "en";
export type ViewMode = "compact" | "detailed";
export type CheckInStatus = "completed" | "missed";
/** Dias de antecedência para colocar o lixo na rua (0 = mesmo dia da coleta). */
export type PutOutLeadDays = 0 | 1 | 2;

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
  /** Data em que o lixo deve/deveria ser colocado na rua. */
  putOutDate: string;
  /** Data oficial da coleta (do .ics). */
  collectionDate: string;
  /**
   * Legado: antiga data única do evento.
   * Preferir collectionDate; mantido para migração de registos antigos.
   */
  eventDate?: string;
  checkedAt: string;
  /** Omitido em registos antigos — tratado como "completed". */
  status?: CheckInStatus;
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
  /** Data oficial da coleta no .ics (não alterar). */
  collectionDate: string;
  /** Data em que o lixo deve ser colocado na rua (calculada). */
  putOutDate: string;
  datetime?: string;
  description?: string;
  location?: string;
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
  /** Antecedência para colocar o lixo (padrão: 1 dia antes). */
  putOutLeadDays: PutOutLeadDays;
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
  putOutLeadDays: 1,
  onboardingCompleted: false,
  activeProfileId: DEFAULT_PROFILE_ID,
};

export const DEFAULT_PROFILE: Profile = {
  id: DEFAULT_PROFILE_ID,
  name: "Principal",
  createdAt: new Date(0).toISOString(),
};
