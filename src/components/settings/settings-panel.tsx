"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  Monitor,
  Download,
  Globe,
  LayoutList,
} from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/hooks/use-i18n";
import {
  getNotificationPermission,
  sendTestNotification,
  setupBackgroundNotifications,
  teardownBackgroundNotifications,
} from "@/lib/notifications";
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
import { cn } from "@/lib/utils";

export function SettingsPanel() {
  const { settings, updateSettings } = useApp();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [testingNotif, setTestingNotif] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "ok" | "partial" | "off">("idle");

  useEffect(() => {
    setNotifPermission(getNotificationPermission());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (notifPermission !== "granted") {
      setPushStatus(settings.notifications.enabled ? "partial" : "off");
      return;
    }
    if (!settings.notifications.enabled) {
      setPushStatus("off");
      return;
    }

    setupBackgroundNotifications().then(({ pushRegistered }) => {
      setPushStatus(pushRegistered ? "ok" : "partial");
    });
  }, [notifPermission, settings.notifications.enabled]);

  const refreshPushRegistration = async () => {
    const { pushRegistered } = await setupBackgroundNotifications();
    setPushStatus(pushRegistered ? "ok" : "partial");
  };

  const updateNotifications = async (partial: Partial<NotificationSettings>) => {
    const next = { ...settings.notifications, ...partial };
    await updateSettings({
      ...settings,
      notifications: next,
    });
    if (partial.enabled === false) {
      await teardownBackgroundNotifications();
      setPushStatus("off");
    } else if (notifPermission === "granted" && next.enabled) {
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
                <p className="text-xs text-primary">{t.settings.pushOk}</p>
              )}
              {pushStatus === "partial" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{t.settings.pushPartial}</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={refreshPushRegistration}>
                    {t.settings.pushResync}
                  </Button>
                </div>
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
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <p>{t.appName} v2.0</p>
          <p className="mt-1">{t.settings.privacy}</p>
          <p className="mt-2 text-xs">{t.settings.iosHint}</p>
        </CardContent>
      </Card>
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
