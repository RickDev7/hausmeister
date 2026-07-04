import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Address,
  AppSettings,
  CheckIn,
  CheckInPhoto,
  CollectionEvent,
  NotificationSettings,
  Profile,
  ShownNotification,
  WasteType,
} from "@/types";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PROFILE,
  DEFAULT_PROFILE_ID,
} from "@/types";

interface StoredSettings extends AppSettings {
  key: "app";
}

interface MuellplanerDB extends DBSchema {
  profiles: {
    key: string;
    value: Profile;
  };
  addresses: {
    key: string;
    value: Address;
    indexes: { "by-name": string; "by-profile": string };
  };
  collections: {
    key: string;
    value: CollectionEvent;
    indexes: { "by-address": string; "by-date": string; "by-type": string; "by-profile": string };
  };
  settings: {
    key: string;
    value: StoredSettings;
  };
  shownNotifications: {
    key: string;
    value: ShownNotification;
    indexes: { "by-event": string };
  };
  checkIns: {
    key: string;
    value: CheckIn;
    indexes: {
      "by-event": string;
      "by-checked-at": string;
      "by-waste-type": WasteType;
      "by-profile": string;
    };
  };
  checkInPhotos: {
    key: string;
    value: CheckInPhoto;
    indexes: { "by-check-in": string };
  };
}

const DB_NAME = "muellplaner";
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<MuellplanerDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MuellplanerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const addressStore = db.createObjectStore("addresses", { keyPath: "id" });
          addressStore.createIndex("by-name", "name");

          const collectionStore = db.createObjectStore("collections", { keyPath: "id" });
          collectionStore.createIndex("by-address", "addressId");
          collectionStore.createIndex("by-date", "date");
          collectionStore.createIndex("by-type", "type");

          db.createObjectStore("settings", { keyPath: "key" });
          const notifStore = db.createObjectStore("shownNotifications", { keyPath: "id" });
          notifStore.createIndex("by-event", "collectionEventId");
        }

        if (oldVersion < 2 && !db.objectStoreNames.contains("checkIns")) {
          const checkInStore = db.createObjectStore("checkIns", { keyPath: "id" });
          checkInStore.createIndex("by-event", "collectionEventId", { unique: true });
          checkInStore.createIndex("by-checked-at", "checkedAt");
          checkInStore.createIndex("by-waste-type", "wasteType");
        }

        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains("profiles")) {
            db.createObjectStore("profiles", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("checkInPhotos")) {
            const photoStore = db.createObjectStore("checkInPhotos", { keyPath: "id" });
            photoStore.createIndex("by-check-in", "checkInId");
          }

          if (db.objectStoreNames.contains("addresses")) {
            const addressStore = transaction.objectStore("addresses");
            if (!addressStore.indexNames.contains("by-profile")) {
              addressStore.createIndex("by-profile", "profileId");
            }
          }

          if (db.objectStoreNames.contains("collections")) {
            const collectionStore = transaction.objectStore("collections");
            if (!collectionStore.indexNames.contains("by-profile")) {
              collectionStore.createIndex("by-profile", "profileId");
            }
          }

          if (db.objectStoreNames.contains("checkIns")) {
            const checkInStore = transaction.objectStore("checkIns");
            if (!checkInStore.indexNames.contains("by-profile")) {
              checkInStore.createIndex("by-profile", "profileId");
            }
          }
        }
      },
    }).then(async (db) => {
      await migrateToV3(db);
      return db;
    });
  }
  return dbPromise;
}

async function migrateToV3(db: IDBPDatabase<MuellplanerDB>): Promise<void> {
  const profiles = await db.getAll("profiles");
  if (profiles.length === 0) {
    await db.put("profiles", DEFAULT_PROFILE);
  }

  const addresses = await db.getAll("addresses");
  for (const addr of addresses) {
    if (!addr.profileId) {
      await db.put("addresses", { ...addr, profileId: DEFAULT_PROFILE_ID });
    }
  }

  const collections = await db.getAll("collections");
  for (const col of collections) {
    if (!col.profileId) {
      await db.put("collections", { ...col, profileId: DEFAULT_PROFILE_ID });
    }
  }

  const checkIns = await db.getAll("checkIns");
  for (const ci of checkIns) {
    if (!ci.profileId) {
      await db.put("checkIns", { ...ci, profileId: DEFAULT_PROFILE_ID });
    }
  }

  const stored = await db.get("settings", "app");
  if (stored) {
    const { key, ...rest } = stored;
    void key;
    const merged = mergeSettings(rest);
    if (
      rest.locale !== merged.locale ||
      rest.viewMode !== merged.viewMode ||
      rest.onboardingCompleted !== merged.onboardingCompleted ||
      rest.activeProfileId !== merged.activeProfileId ||
      rest.notifications?.eveningReminderEnabled === undefined
    ) {
      await db.put("settings", { key: "app", ...merged });
    }
  }
}

function mergeNotificationSettings(
  stored?: Partial<NotificationSettings>
): NotificationSettings {
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...stored };
}

function mergeSettings(stored: Partial<AppSettings> | undefined): AppSettings {
  if (!stored) return DEFAULT_APP_SETTINGS;
  return {
    theme: stored.theme ?? DEFAULT_APP_SETTINGS.theme,
    notifications: mergeNotificationSettings(stored.notifications),
    locale: stored.locale ?? DEFAULT_APP_SETTINGS.locale,
    viewMode: stored.viewMode ?? DEFAULT_APP_SETTINGS.viewMode,
    onboardingCompleted: stored.onboardingCompleted ?? DEFAULT_APP_SETTINGS.onboardingCompleted,
    activeProfileId: stored.activeProfileId ?? DEFAULT_APP_SETTINGS.activeProfileId,
  };
}

async function deleteShownNotificationsForEventIds(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;

  const db = await getDB();
  const tx = db.transaction("shownNotifications", "readwrite");
  const index = tx.store.index("by-event");

  for (const eventId of eventIds) {
    const notifications = await index.getAll(eventId);
    for (const notification of notifications) {
      await tx.store.delete(notification.id);
    }
  }

  await tx.done;
}

// Profiles
export async function getAllProfiles(): Promise<Profile[]> {
  const db = await getDB();
  return db.getAll("profiles");
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDB();
  await db.put("profiles", profile);
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("profiles", id);
}

// Addresses
export async function getAllAddresses(): Promise<Address[]> {
  const db = await getDB();
  return db.getAll("addresses");
}

export async function saveAddress(address: Address): Promise<void> {
  const db = await getDB();
  await db.put("addresses", address);
}

export async function deleteAddress(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["addresses", "collections", "shownNotifications"], "readwrite");

  const collectionIndex = tx.objectStore("collections").index("by-address");
  const events = await collectionIndex.getAll(id);
  const eventIds = events.map((event) => event.id);

  await tx.objectStore("addresses").delete(id);
  for (const event of events) {
    await tx.objectStore("collections").delete(event.id);
  }

  await tx.done;
  await deleteShownNotificationsForEventIds(eventIds);
  await deleteCheckInsForEventIds(eventIds);
}

// Collections
export async function getAllCollections(): Promise<CollectionEvent[]> {
  const db = await getDB();
  return db.getAll("collections");
}

export async function saveCollection(event: CollectionEvent): Promise<void> {
  const db = await getDB();
  await db.put("collections", event);
}

export async function replaceCollectionsForAddress(
  addressId: string,
  events: CollectionEvent[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("collections", "readwrite");

  const existing = await tx.store.index("by-address").getAll(addressId);
  const removedEventIds = existing.map((event) => event.id);

  for (const event of existing) {
    await tx.store.delete(event.id);
  }
  for (const event of events) {
    await tx.store.put(event);
  }

  await tx.done;

  const keptEventIds = new Set(events.map((event) => event.id));
  const orphanedEventIds = removedEventIds.filter((id) => !keptEventIds.has(id));
  await deleteShownNotificationsForEventIds(orphanedEventIds);
  await deleteCheckInsForEventIds(orphanedEventIds);
}

// Settings
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const stored = await db.get("settings", "app");
  if (!stored) return DEFAULT_APP_SETTINGS;
  const { key, ...settings } = stored;
  void key;
  return mergeSettings(settings);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put("settings", { key: "app", ...settings });
}

// Shown notifications
export async function getShownNotifications(): Promise<ShownNotification[]> {
  const db = await getDB();
  return db.getAll("shownNotifications");
}

export async function markNotificationShown(
  notification: ShownNotification
): Promise<void> {
  const db = await getDB();
  await db.put("shownNotifications", notification);
}

export async function cleanupOldNotifications(beforeDate: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAll("shownNotifications");
  const tx = db.transaction("shownNotifications", "readwrite");
  for (const n of all) {
    if (n.shownAt < beforeDate) {
      await tx.store.delete(n.id);
    }
  }
  await tx.done;
}

// Check-ins
export async function addCheckIn(checkIn: CheckIn): Promise<void> {
  const db = await getDB();
  await db.put("checkIns", checkIn);
}

export const saveCheckIn = addCheckIn;

export async function getAllCheckIns(): Promise<CheckIn[]> {
  const db = await getDB();
  const all = await db.getAll("checkIns");
  return all.sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
}

export async function getCheckInsByDate(date: string): Promise<CheckIn[]> {
  const all = await getAllCheckIns();
  return all.filter((checkIn) => checkIn.checkedAt.startsWith(date));
}

export async function getCheckInByEventId(eventId: string): Promise<CheckIn | undefined> {
  const db = await getDB();
  return db.getFromIndex("checkIns", "by-event", eventId);
}

export async function deleteCheckIn(id: string): Promise<void> {
  const db = await getDB();
  const photo = await db.getFromIndex("checkInPhotos", "by-check-in", id);
  if (photo) await db.delete("checkInPhotos", photo.id);
  await db.delete("checkIns", id);
}

export async function deleteCheckInsForEventIds(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;

  const db = await getDB();
  const tx = db.transaction(["checkIns", "checkInPhotos"], "readwrite");
  const index = tx.objectStore("checkIns").index("by-event");

  for (const eventId of eventIds) {
    const checkIn = await index.get(eventId);
    if (checkIn) {
      const photos = await tx.objectStore("checkInPhotos").index("by-check-in").getAll(checkIn.id);
      for (const ph of photos) {
        await tx.objectStore("checkInPhotos").delete(ph.id);
      }
      await tx.objectStore("checkIns").delete(checkIn.id);
    }
  }

  await tx.done;
}

// Photos
export async function getAllPhotos(): Promise<CheckInPhoto[]> {
  const db = await getDB();
  return db.getAll("checkInPhotos");
}

export async function savePhoto(photo: CheckInPhoto): Promise<void> {
  const db = await getDB();
  await db.put("checkInPhotos", photo);
}

export async function getPhotoByCheckInId(checkInId: string): Promise<CheckInPhoto | undefined> {
  const db = await getDB();
  return db.getFromIndex("checkInPhotos", "by-check-in", checkInId);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("checkInPhotos", id);
}
