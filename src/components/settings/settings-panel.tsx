"use client";

import { Bell, Moon, Sun, Monitor, Download } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useTheme } from "@/components/theme-provider";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from "@/lib/notifications";
import type { NotificationSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function SettingsPanel() {
  const { settings, updateSettings } = useApp();
  const { theme, setTheme } = useTheme();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [testingNotif, setTestingNotif] = useState(false);

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
    await updateSettings({
      ...settings,
      notifications: { ...settings.notifications, ...partial },
    });
  };

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      await updateNotifications({ enabled: true });
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
        const permission = await requestNotificationPermission();
        setNotifPermission(permission);
        if (permission === "granted") {
          await updateNotifications({ enabled: true });
          await sendTestNotification();
        }
      }
    } finally {
      setTestingNotif(false);
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="space-y-4">
      {deferredPrompt && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">Instalar app</p>
              <p className="text-sm text-muted-foreground">
                Instalar o Planejador de Lixo no seu dispositivo
              </p>
            </div>
            <Button onClick={installApp} size="sm">
              <Download className="h-4 w-4" />
              Instalar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>Escolha um tema claro ou escuro</CardDescription>
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
            Notificações
          </CardTitle>
          <CardDescription>
            Lembretes no dia anterior e no dia da coleta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-enabled">Ativar notificações</Label>
            {notifPermission === "granted" ? (
              <Switch
                id="notif-enabled"
                checked={settings.notifications.enabled}
                onCheckedChange={(checked) => updateNotifications({ enabled: checked })}
              />
            ) : (
              <Button size="sm" onClick={enableNotifications}>
                Permitir
              </Button>
            )}
          </div>

          {settings.notifications.enabled && notifPermission === "granted" && (
            <>
              <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>No dia anterior</Label>
                    <p className="text-xs text-muted-foreground">
                      Lembrete no dia antes da coleta
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.dayBeforeEnabled}
                    onCheckedChange={(checked) =>
                      updateNotifications({ dayBeforeEnabled: checked })
                    }
                  />
                </div>
                {settings.notifications.dayBeforeEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="day-before-time">Horário</Label>
                    <Input
                      id="day-before-time"
                      type="time"
                      value={settings.notifications.dayBeforeTime}
                      onChange={(e) =>
                        updateNotifications({ dayBeforeTime: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>No dia da coleta</Label>
                    <p className="text-xs text-muted-foreground">
                      Lembrete no dia da coleta
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.dayOfEnabled}
                    onCheckedChange={(checked) =>
                      updateNotifications({ dayOfEnabled: checked })
                    }
                  />
                </div>
                {settings.notifications.dayOfEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="day-of-time">Horário</Label>
                    <Input
                      id="day-of-time"
                      type="time"
                      value={settings.notifications.dayOfTime}
                      onChange={(e) =>
                        updateNotifications({ dayOfTime: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={testNotification}
                disabled={testingNotif}
              >
                {testingNotif ? "Enviando..." : "Enviar notificação de teste"}
              </Button>
            </>
          )}

          {notifPermission === "denied" && (
            <p className="text-sm text-destructive">
              As notificações foram bloqueadas. Ative-as nas configurações do navegador.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <p>Planejador de Lixo v1.0</p>
          <p className="mt-1">Todos os dados são armazenados localmente no seu dispositivo.</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
