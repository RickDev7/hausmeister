"use client";

import { useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { buildAddressMap } from "@/lib/address-map";
import { startNotificationScheduler } from "@/lib/notifications";

export function NotificationScheduler() {
  const { addresses, collections, settings } = useApp();

  useEffect(() => {
    if (!settings.notifications.enabled) return;
    return startNotificationScheduler(buildAddressMap(addresses));
  }, [addresses, collections, settings.notifications]);

  return null;
}
