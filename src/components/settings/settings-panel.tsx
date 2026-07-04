"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  QrCode,
  UserPlus,
  Globe,
  LayoutList,
} from "lucide-react";
import QRCode from "qrcode";
import { useApp } from "@/hooks/use-app";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/hooks/use-i18n";
import {
  getNotificationPermission,
  sendTestNotification,
  setupBackgroundNotifications,
  teardownBackgroundNotifications,
} from "@/lib/notifications";
import {
  downloadBackup,
  exportBackup,
  importBackupFromFile,
} from "@/lib/services/backup-service";
import type { Locale, NotificationSettings, ViewMode } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SettingsPanel() {
  const { settings, updateSettings, profiles, setActiveProfile, addProfile, refresh } = useApp();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [testingNotif, setTestingNotif] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "ok" | "partial" | "off">("idle");
  const [newProfileName, setNewProfileName] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const updateNotifications = async (partial: Partial<NotificationSettings>) => {
    const next = { ...settings.notifications, ...partial };
    await updateSettings({
      ...settings,
      notifications: next,
    });
    if (partial.enabled === false) {
      await teardownBackgroundNotifications();
      setPushStatus("off");
    } else if (partial.enabled === true && notifPermission === "granted") {
      const { pushRegistered } = await setupBackgroundNotifications();
      setPushStatus(pushRegistered ? "ok" : "partial");
    }
  };

  const enableNotifications = async () => {
    const { permission, pushRegistered } = await setupBackgroundNotifications();
    setNotifPermission(permission);
    if (permission === "granted") {
      await updateNotifications({ enabled: true });
      setPushStatus(pushRegistered ? "ok" : "partial");
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const testNotification = async () => {
    setTestingNotif(true);
    try {
      const sent = await sendTestNotification();
      if (!sent) {
        const { permission, pushRegistered } = await setupBackgroundNotifications();
        setNotifPermission(permission);
        if (permission === "granted") {
          await updateNotifications({ enabled: true });
          setPushStatus(pushRegistered ? "ok" : "partial");
          await sendTestNotification();
        }
      }
    } finally {
      setTestingNotif(false);
    }
  };

  const handleLocale = async (locale: Locale) => {
    await updateSettings({ ...settings, locale });
    document.documentElement.lang = locale;
  };

  const handleViewMode = async (viewMode: ViewMode) => {
    await updateSettings({ ...settings, viewMode });
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) return;
    await addProfile(newProfileName.trim());
    setNewProfileName("");
  };

  const handleImportBackup = async (file: File) => {
    await importBackupFromFile(file);
    await refresh();
  };

  const generateQr = async () => {
    const backup = await exportBackup();
    const json = JSON.stringify(backup);
    const url = await QRCode.toDataURL(json, { width: 280, margin: 2 });
    setQrDataUrl(url);
    setQrOpen(true);
  };

  const themeOptions = [
    { value: "light" as const, label: t.settings.themeLight, icon: Sun },
    { value: "dark" as const, label: t.settings.themeDark, icon: Moon },
    { value: "system" as const, label: t.settings.themeSystem, icon: Monitor },
  ];

  return (
    <div className="space-y-4">
      {deferredPrompt && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{t.settings.install}</p>
              <p className="text-sm text-muted-foreground">{t.settings.installHint}</p>
            </div>
            <Button onClick={installApp} size="sm">
              <Download className="h-4 w-4" />
              {t.settings.install}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.settings.locale}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={settings.locale} onValueChange={(v) => handleLocale(v as Locale)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português (BR)</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-5 w-5" />
            {t.settings.viewMode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {(["compact", "detailed"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewMode(mode)}
                className={cn(
                  "rounded-2xl border p-3 text-sm font-medium transition-colors",
                  settings.viewMode === mode
                    ? "border-primary bg-primary-container text-on-primary-container"
                    : "border-outline-variant hover:bg-surface-container"
                )}
              >
                {mode === "compact" ? t.settings.compact : t.settings.detailed}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.settings.profiles}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={settings.activeProfileId} onValueChange={setActiveProfile}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder={t.settings.addProfile}
            />
            <Button onClick={handleAddProfile} disabled={!newProfileName.trim()}>
              +
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {t.settings.appearance}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors",
                  theme === value
                    ? "border-primary bg-primary-container text-on-primary-container"
                    : "border-outline-variant hover:bg-surface-container"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.settings.notifications}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-enabled">{t.settings.enableNotif}</Label>
            {notifPermission === "granted" ? (
              <Switch
                id="notif-enabled"
                checked={settings.notifications.enabled}
                onCheckedChange={(checked) => updateNotifications({ enabled: checked })}
              />
            ) : (
              <Button size="sm" onClick={enableNotifications}>
                {t.settings.allow}
              </Button>
            )}
          </div>

          {settings.notifications.enabled && notifPermission === "granted" && (
            <>
              {pushStatus === "ok" && (
                <p className="text-xs text-primary">
                  Web Push ativo — lembretes funcionam com o app fechado.
                </p>
              )}
              {pushStatus === "partial" && (
                <p className="text-xs text-muted-foreground">
                  Permissão concedida. Configure VAPID keys no servidor para push com app fechado
                  (fallback: sync periódico no Android).
                </p>
              )}
              <NotificationTimeBlock
                label={t.settings.dayBefore}
                enabled={settings.notifications.dayBeforeEnabled}
                time={settings.notifications.dayBeforeTime}
                onEnabledChange={(v) => updateNotifications({ dayBeforeEnabled: v })}
                onTimeChange={(v) => updateNotifications({ dayBeforeTime: v })}
                timeLabel={t.settings.time}
              />
              <NotificationTimeBlock
                label={t.settings.dayOf}
                enabled={settings.notifications.dayOfEnabled}
                time={settings.notifications.dayOfTime}
                onEnabledChange={(v) => updateNotifications({ dayOfEnabled: v })}
                onTimeChange={(v) => updateNotifications({ dayOfTime: v })}
                timeLabel={t.settings.time}
              />
              <NotificationTimeBlock
                label={t.settings.evening}
                hint={t.settings.eveningHint}
                enabled={settings.notifications.eveningReminderEnabled}
                time={settings.notifications.eveningReminderTime}
                onEnabledChange={(v) => updateNotifications({ eveningReminderEnabled: v })}
                onTimeChange={(v) => updateNotifications({ eveningReminderTime: v })}
                timeLabel={t.settings.time}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={testNotification}
                disabled={testingNotif}
              >
                {testingNotif ? "..." : t.settings.testNotif}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.backup}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => downloadBackup()}>
            <Download className="h-4 w-4" />
            {t.settings.export}
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await handleImportBackup(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" className="w-full" onClick={() => importRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {t.settings.import}
          </Button>
          <Button variant="outline" className="w-full" onClick={generateQr}>
            <QrCode className="h-4 w-4" />
            {t.settings.qr}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <p>{t.appName} v2.0</p>
          <p className="mt-1">{t.settings.privacy}</p>
          <p className="mt-2 text-xs">{t.settings.iosHint}</p>
        </CardContent>
      </Card>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.qr}</DialogTitle>
          </DialogHeader>
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR backup" className="mx-auto rounded-xl" />
          )}
          <p className="text-center text-xs text-muted-foreground">
            Escaneie para transferir dados entre dispositivos.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationTimeBlock({
  label,
  hint,
  enabled,
  time,
  onEnabledChange,
  onTimeChange,
  timeLabel,
}: {
  label: string;
  hint?: string;
  enabled: boolean;
  time: string;
  onEnabledChange: (v: boolean) => void;
  onTimeChange: (v: string) => void;
  timeLabel: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>{label}</Label>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      {enabled && (
        <div className="space-y-2">
          <Label>{timeLabel}</Label>
          <Input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} />
        </div>
      )}
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
