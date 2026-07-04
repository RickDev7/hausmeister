"use client";

import { AppHeader } from "@/components/layout/app-header";
import { CollectionDashboard } from "@/components/collections/collection-dashboard";
import { useI18n } from "@/hooks/use-i18n";

export function HomePageContent() {
  const { t } = useI18n();

  return (
    <>
      <AppHeader title={t.appName} subtitle={t.home.subtitle} />
      <div className="py-4">
        <CollectionDashboard />
      </div>
    </>
  );
}
