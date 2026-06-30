import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Address,
  AppSettings,
  CheckIn,
  CollectionEvent,
  NotificationSettings,
  ShownNotification,
  WasteType,
} from "@/types";
import { DEFAULT_APP_SETTINGS, DEFAULT_NOTIFICATION_SETTINGS } from "@/types";

interface StoredSettings extends AppSettings {
  key: "app";
}

interface MuellplanerDB extends DBSchema {
  addresses: {
    key: string;
    value: Address;
    indexes: { "by-name": string };
  };
  collections: {
    key: string;
    value: CollectionEvent;
    indexes: { "by-address": string; "by-date": string; "by-type": string };
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
    };
  };
}

const DB_NAME = "muellplaner";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<MuellplanerDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MuellplanerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
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
      },
    });
  }
  return dbPromise;
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
  await db.delete("checkIns", id);
}

export async function deleteCheckInsForEventIds(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;

  const db = await getDB();
  const tx = db.transaction("checkIns", "readwrite");
  const index = tx.store.index("by-event");

  for (const eventId of eventIds) {
    const checkIn = await index.get(eventId);
    if (checkIn) {
      await tx.store.delete(checkIn.id);
    }
  }

  await tx.done;
}
