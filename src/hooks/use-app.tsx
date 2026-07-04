"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAllAddresses,
  getAllCheckIns,
  getAllCollections,
  getAllProfiles,
  getSettings,
  saveProfile,
  saveSettings,
} from "@/lib/db";
import type { Address, AppSettings, CheckIn, CollectionEvent, Profile } from "@/types";
import { DEFAULT_APP_SETTINGS, DEFAULT_PROFILE } from "@/types";
import type { EnrichedCollection } from "@/lib/collections";
import { performCheckIn, revertCheckIn, type CheckInOptions } from "@/lib/services/check-in-service";
import { generateId } from "@/lib/utils";

interface AppContextValue {
  profiles: Profile[];
  addresses: Address[];
  collections: CollectionEvent[];
  checkIns: CheckIn[];
  checkedEventIds: Set<string>;
  settings: AppSettings;
  activeProfile: Profile;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  addProfile: (name: string) => Promise<Profile>;
  checkInForEvent: (event: EnrichedCollection, options?: Partial<CheckInOptions>) => Promise<void>;
  undoCheckInForEvent: (collectionEventId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function filterByProfile<T extends { profileId: string }>(items: T[], profileId: string): T[] {
  return items.filter((i) => i.profileId === profileId);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([DEFAULT_PROFILE]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [collections, setCollections] = useState<CollectionEvent[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === settings.activeProfileId) ?? DEFAULT_PROFILE,
    [profiles, settings.activeProfileId]
  );

  const profileAddresses = useMemo(
    () => filterByProfile(addresses, settings.activeProfileId),
    [addresses, settings.activeProfileId]
  );

  const profileCollections = useMemo(
    () => filterByProfile(collections, settings.activeProfileId),
    [collections, settings.activeProfileId]
  );

  const profileCheckIns = useMemo(
    () => filterByProfile(checkIns, settings.activeProfileId),
    [checkIns, settings.activeProfileId]
  );

  const checkedEventIds = useMemo(
    () => new Set(profileCheckIns.map((c) => c.collectionEventId)),
    [profileCheckIns]
  );

  const refresh = useCallback(async () => {
    const [profs, addrs, colls, ins, sett] = await Promise.all([
      getAllProfiles(),
      getAllAddresses(),
      getAllCollections(),
      getAllCheckIns(),
      getSettings(),
    ]);
    setProfiles(profs.length ? profs : [DEFAULT_PROFILE]);
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

  const setActiveProfile = useCallback(
    async (profileId: string) => {
      await updateSettings({ ...settings, activeProfileId: profileId });
    },
    [settings, updateSettings]
  );

  const addProfile = useCallback(async (name: string) => {
    const profile: Profile = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveProfile(profile);
    setProfiles((prev) => [...prev, profile]);
    return profile;
  }, []);

  const checkInForEvent = useCallback(
    async (event: EnrichedCollection, options?: Partial<CheckInOptions>) => {
      const checkIn = await performCheckIn(event, {
        profileId: settings.activeProfileId,
        note: options?.note,
        photoDataUrl: options?.photoDataUrl,
      });
      setCheckIns((prev) => {
        const without = prev.filter((c) => c.collectionEventId !== event.id);
        return [checkIn, ...without].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
      });
    },
    [settings.activeProfileId]
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
        profiles,
        addresses: profileAddresses,
        collections: profileCollections,
        checkIns: profileCheckIns,
        checkedEventIds,
        settings,
        activeProfile,
        loading,
        refresh,
        updateSettings,
        setActiveProfile,
        addProfile,
        checkInForEvent,
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
