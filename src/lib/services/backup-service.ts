import {
  getAllAddresses,
  getAllCheckIns,
  getAllCollections,
  getAllProfiles,
  getAllPhotos,
  getSettings,
  saveAddress,
  saveCollection,
  saveCheckIn,
  saveProfile,
  savePhoto,
  saveSettings,
  clearAllData,
} from "@/lib/db";
import type { BackupData } from "@/types";
import { DEFAULT_APP_SETTINGS } from "@/types";

export async function exportBackup(): Promise<BackupData> {
  const [profiles, addresses, collections, checkIns, checkInPhotos, settings] =
    await Promise.all([
      getAllProfiles(),
      getAllAddresses(),
      getAllCollections(),
      getAllCheckIns(),
      getAllPhotos(),
      getSettings(),
    ]);

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    profiles,
    addresses,
    collections,
    checkIns,
    checkInPhotos,
    settings,
  };
}

export async function downloadBackup(): Promise<void> {
  const data = await exportBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `muellplaner-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(data: BackupData): Promise<void> {
  if (data.version !== 3) throw new Error("Versão de backup incompatível");

  await clearAllData();

  for (const p of data.profiles) await saveProfile(p);
  for (const a of data.addresses) await saveAddress(a);
  for (const c of data.collections) await saveCollection(c);
  for (const ci of data.checkIns) await saveCheckIn(ci);
  for (const ph of data.checkInPhotos ?? []) await savePhoto(ph);
  await saveSettings(data.settings ?? DEFAULT_APP_SETTINGS);
}

export async function importBackupFromFile(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as BackupData;
  await importBackup(data);
}

export async function fetchWebcal(url: string): Promise<string> {
  const normalized = url.replace(/^webcal:\/\//i, "https://").replace(/^webcal:/i, "https:");
  const res = await fetch(normalized);
  if (!res.ok) throw new Error(`Falha ao baixar calendário: ${res.status}`);
  return res.text();
}
