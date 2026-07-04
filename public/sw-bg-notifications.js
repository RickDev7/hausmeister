/* eslint-disable no-restricted-globals */
/**
 * Verificação de notificações em background via IndexedDB (fallback sem Web Push).
 */
const DB_NAME = "muellplaner";
const DB_VERSION = 3;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result || []);
  });
}

function put(store, value) {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(undefined);
  });
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isTimeReached(targetTime, now) {
  const [h, m] = targetTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h || 0, m || 0, 0, 0);
  return now >= target;
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getCheckInByEventId(db, eventId) {
  const tx = db.transaction("checkIns", "readonly");
  const index = tx.objectStore("checkIns").index("by-event");
  return new Promise((resolve, reject) => {
    const req = index.get(eventId);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function runBackgroundNotificationCheck() {
  const db = await openDb();

  const settingsTx = db.transaction("settings", "readonly");
  const stored = await new Promise((resolve, reject) => {
    const req = settingsTx.objectStore("settings").get("app");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });

  if (!stored || !stored.notifications?.enabled) return;

  const notifications = stored.notifications;
  const now = new Date();
  const today = formatDate(now);
  const tomorrow = formatDate(addDays(now, 1));

  const tx = db.transaction(["addresses", "collections", "shownNotifications", "checkIns"], "readwrite");
  const addresses = await getAll(tx.objectStore("addresses"));
  const collections = await getAll(tx.objectStore("collections"));
  const shown = await getAll(tx.objectStore("shownNotifications"));
  const shownSet = new Set(shown.map((s) => `${s.collectionEventId}_${s.kind}`));
  const addressMap = new Map(addresses.map((a) => [a.id, a.name]));

  for (const event of collections) {
    const addressName = addressMap.get(event.addressId) || "Desconhecido";

    if (notifications.dayBeforeEnabled && event.date === tomorrow) {
      const kind = "day_before";
      const key = `${event.id}_${kind}`;
      if (!shownSet.has(key) && isTimeReached(notifications.dayBeforeTime, now)) {
        await self.registration.showNotification(`Amanhã: ${event.typeLabel}`, {
          body: `${addressName} — ${event.typeLabel} será coletado amanhã.`,
          tag: key,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        });
        await put(tx.objectStore("shownNotifications"), {
          id: generateId(),
          collectionEventId: event.id,
          kind,
          shownAt: today,
        });
        shownSet.add(key);
      }
    }

    if (notifications.dayOfEnabled && event.date === today) {
      const kind = "day_of";
      const key = `${event.id}_${kind}`;
      if (!shownSet.has(key) && isTimeReached(notifications.dayOfTime, now)) {
        await self.registration.showNotification(`Hoje: ${event.typeLabel}`, {
          body: `${addressName} — ${event.typeLabel} será coletado hoje.`,
          tag: key,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        });
        await put(tx.objectStore("shownNotifications"), {
          id: generateId(),
          collectionEventId: event.id,
          kind,
          shownAt: today,
        });
        shownSet.add(key);
      }
    }

    if (notifications.eveningReminderEnabled && event.date === today) {
      const kind = "evening_missed";
      const key = `${event.id}_${kind}`;
      if (!shownSet.has(key) && isTimeReached(notifications.eveningReminderTime, now)) {
        const checkIn = await getCheckInByEventId(db, event.id);
        if (!checkIn) {
          await self.registration.showNotification(`Lembrete: ${event.typeLabel}`, {
            body: `${addressName} — ainda sem check-in para a coleta de hoje.`,
            tag: key,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
          });
          await put(tx.objectStore("shownNotifications"), {
            id: generateId(),
            collectionEventId: event.id,
            kind,
            shownAt: today,
          });
          shownSet.add(key);
        }
      }
    }
  }

  await tx.done;
}

async function hasCheckInForEvent(eventId) {
  try {
    const db = await openDb();
    const checkIn = await getCheckInByEventId(db, eventId);
    return !!checkIn;
  } catch {
    return false;
  }
}

self.runBackgroundNotificationCheck = runBackgroundNotificationCheck;
self.hasCheckInForEvent = hasCheckInForEvent;
