"use client";

import { AppHeader } from "@/components/layout/app-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { useI18n } from "@/hooks/use-i18n";

export function SettingsPageContent() {
  const { t } = useI18n();

  return (
    <>
      <AppHeader title={t.settings.title} />
      <div className="py-4">
        <SettingsPanel />
      </div>
    </>
  );
}
