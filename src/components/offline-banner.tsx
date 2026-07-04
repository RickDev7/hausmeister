"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-error-container px-4 py-2 text-sm text-on-error-container"
    >
      <WifiOff className="h-4 w-4" aria-hidden />
      {t.common.offline}
    </div>
  );
}
