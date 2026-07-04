"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAllAddresses,
  getAllCheckIns,
  getAllCollections,
  getSettings,
  saveSettings,
} from "@/lib/db";
import type { Address, AppSettings, CheckIn, CollectionEvent } from "@/types";
import { DEFAULT_APP_SETTINGS } from "@/types";
import type { EnrichedCollection } from "@/lib/collections";
import { performCheckIn, performMissedCollection, revertCheckIn, type CheckInOptions } from "@/lib/services/check-in-service";

interface AppContextValue {
  addresses: Address[];
  collections: CollectionEvent[];
  checkIns: CheckIn[];
  checkedEventIds: Set<string>;
  completedEventIds: Set<string>;
  missedEventIds: Set<string>;
  settings: AppSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  checkInForEvent: (event: EnrichedCollection, options?: Partial<CheckInOptions>) => Promise<void>;
  missedCollectionForEvent: (event: EnrichedCollection, note: string) => Promise<void>;
  undoCheckInForEvent: (collectionEventId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [collections, setCollections] = useState<CollectionEvent[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);

  const checkedEventIds = useMemo(
    () => new Set(checkIns.map((c) => c.collectionEventId)),
    [checkIns]
  );

  const completedEventIds = useMemo(
    () => new Set(checkIns.filter((c) => c.status !== "missed").map((c) => c.collectionEventId)),
    [checkIns]
  );

  const missedEventIds = useMemo(
    () => new Set(checkIns.filter((c) => c.status === "missed").map((c) => c.collectionEventId)),
    [checkIns]
  );

  const refresh = useCallback(async () => {
    const [addrs, colls, ins, sett] = await Promise.all([
      getAllAddresses(),
      getAllCollections(),
      getAllCheckIns(),
      getSettings(),
    ]);
    setAddresses(addrs.sort((a, b) => a.name.localeCompare(b.name)));
    setCollections(colls);
    setCheckIns(ins);
    setSettings(sett);
    setLoading(false);
  }, []);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const checkInForEvent = useCallback(
    async (event: EnrichedCollection, options?: Partial<CheckInOptions>) => {
      const checkIn = await performCheckIn(event, {
        note: options?.note,
        photoDataUrl: options?.photoDataUrl,
      });
      setCheckIns((prev) => {
        const without = prev.filter((c) => c.collectionEventId !== event.id);
        return [checkIn, ...without].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
      });
    },
    []
  );

  const missedCollectionForEvent = useCallback(
    async (event: EnrichedCollection, note: string) => {
      const checkIn = await performMissedCollection(event, { note });
      setCheckIns((prev) => {
        const without = prev.filter((c) => c.collectionEventId !== event.id);
        return [checkIn, ...without].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
      });
    },
    []
  );

  const undoCheckInForEvent = useCallback(async (collectionEventId: string) => {
    await revertCheckIn(collectionEventId);
    setCheckIns((prev) => prev.filter((c) => c.collectionEventId !== collectionEventId));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppContext.Provider
      value={{
        addresses,
        collections,
        checkIns,
        checkedEventIds,
        completedEventIds,
        missedEventIds,
        settings,
        loading,
        refresh,
        updateSettings,
        checkInForEvent,
        missedCollectionForEvent,
        undoCheckInForEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
