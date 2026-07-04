"use client";

import { useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { buildAddressMap } from "@/lib/address-map";
import {
  startNotificationScheduler,
  syncNotificationsToServiceWorker,
  syncPushSchedule,
} from "@/lib/notifications";

export function NotificationScheduler() {
  const { addresses, collections, settings } = useApp();

  useEffect(() => {
    if (!settings.notifications.enabled) return;
    const map = buildAddressMap(addresses);
    syncNotificationsToServiceWorker();
    syncPushSchedule();
    return startNotificationScheduler(map);
  }, [addresses, collections, settings.notifications]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_EXPIRED" && settings.notifications.enabled) {
        syncPushSchedule();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [settings.notifications.enabled]);

  return null;
}
