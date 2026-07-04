"use client";

import { createContext, useContext, useMemo } from "react";
import { useApp } from "@/hooks/use-app";
import { getMessages, type Messages } from "@/i18n";
import type { Locale } from "@/types";

interface I18nContextValue {
  locale: Locale;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const value = useMemo(
    () => ({ locale: settings.locale, t: getMessages(settings.locale) }),
    [settings.locale]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n deve ser usado dentro de I18nProvider");
  return ctx;
}
